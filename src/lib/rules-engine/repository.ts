import { prisma } from "@/lib/prisma";
import type { TerritorialUnit } from "@prisma/client";
import { resolveStatus } from "./engine";
import type {
  LegalActDTO,
  SourceVersionDTO,
  StatusRecordDTO,
  StatusResolutionResult,
  TerritorialUnitDTO,
} from "./types";

function toLegalActDTO(act: {
  id: string;
  type: string;
  issuingBody: string;
  number: string;
  title: string;
  adoptedAt: Date;
  effectiveAt: Date;
  officialUrl: string;
}): LegalActDTO {
  return act;
}

function toSourceVersionDTO(v: {
  id: string;
  label: string;
  publishedAt: Date | null;
  isDemoData: boolean;
  legalAct: Parameters<typeof toLegalActDTO>[0];
}): SourceVersionDTO {
  return {
    id: v.id,
    label: v.label,
    publishedAt: v.publishedAt,
    isDemoData: v.isDemoData,
    legalAct: toLegalActDTO(v.legalAct),
  };
}

function toUnitDTO(u: {
  id: string;
  katottg: string;
  name: string;
  type: TerritorialUnitDTO["type"];
  parentId: string | null;
  validFrom: Date;
  validTo: Date | null;
  isDemoData: boolean;
}): TerritorialUnitDTO {
  return u;
}

/** Піднімається вгору по ланцюгу батьків, використовуючи поточну (не історичну) ієрархію. */
export async function getAncestors(unitId: string): Promise<TerritorialUnitDTO[]> {
  const ancestors: TerritorialUnitDTO[] = [];
  let currentId: string | null = unitId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break; // захист від циклів у пошкоджених даних
    visited.add(currentId);
    const unit: TerritorialUnit | null = await prisma.territorialUnit.findUnique({ where: { id: currentId } });
    if (!unit || !unit.parentId) break;
    const parent: TerritorialUnit | null = await prisma.territorialUnit.findUnique({ where: { id: unit.parentId } });
    if (!parent) break;
    ancestors.push(toUnitDTO(parent));
    currentId = parent.id;
  }
  return ancestors;
}

export async function getUnitById(unitId: string): Promise<TerritorialUnitDTO | null> {
  const unit = await prisma.territorialUnit.findUnique({ where: { id: unitId } });
  return unit ? toUnitDTO(unit) : null;
}

export async function getUnitByKatottg(katottg: string): Promise<TerritorialUnitDTO | null> {
  const unit = await prisma.territorialUnit.findFirst({
    where: { katottg: { equals: katottg, mode: "insensitive" } },
  });
  return unit ? toUnitDTO(unit) : null;
}

async function getRecordsWithRelationsForUnits(unitIds: string[]): Promise<StatusRecordDTO[]> {
  const records = await prisma.territoryStatusRecord.findMany({
    where: { territorialUnitId: { in: unitIds } },
    include: {
      statusCategory: true,
      legalAct: true,
      sourceVersion: { include: { legalAct: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return records
    .filter((r) => r.sourceVersion.status === "PUBLISHED")
    .map((r) => ({
      id: r.id,
      territorialUnitId: r.territorialUnitId,
      statusCategory: r.statusCategory,
      recordLevel: r.recordLevel,
      startDate: r.startDate,
      endDate: r.endDate,
      sourceVersion: toSourceVersionDTO(r.sourceVersion),
      legalAct: toLegalActDTO(r.legalAct),
      sourceExcerpt: r.sourceExcerpt,
      sourceRowRef: r.sourceRowRef,
      needsReview: r.needsReview,
      reviewReason: r.reviewReason,
    }));
}

/**
 * Повний вертикальний зріз: знаходить об'єкт, будує адміністративний
 * ланцюг, підбирає редакцію джерела для дати та застосовує рушій.
 */
export async function resolveStatusForUnit(
  unitId: string,
  asOfDate: Date
): Promise<StatusResolutionResult> {
  const targetUnit = await getUnitById(unitId);
  if (!targetUnit) {
    return resolveStatus({
      targetUnit: null,
      ancestors: [],
      candidateSourceVersions: [],
      records: [],
      asOfDate,
    });
  }

  const ancestors = await getAncestors(unitId);
  const allUnitIds = [targetUnit.id, ...ancestors.map((a) => a.id)];
  const records = await getRecordsWithRelationsForUnits(allUnitIds);

  // Кандидатні редакції визначаються з усіх опублікованих версій джерела,
  // а не лише тих, що містять записи для цього об'єкта — інакше об'єкт без
  // жодного запису в жодній версії хибно виглядав би так, ніби на обрану
  // дату взагалі не було чинної редакції (NO_REDACTION_FOR_DATE), замість
  // коректного "об'єкт знайдено, запис відсутній" (FOUND_NO_RECORD).
  const candidateSourceVersions = await getAllPublishedSourceVersions();

  return resolveStatus({
    targetUnit,
    ancestors,
    candidateSourceVersions,
    records,
    asOfDate,
  });
}

/** Дата й час останнього оновлення бази загалом (найновіша опублікована редакція будь-якого джерела). */
export async function getLatestPublishedUpdateTimestamp(): Promise<Date | null> {
  const latest = await prisma.sourceVersion.findFirst({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
  });
  return latest?.publishedAt ?? null;
}

async function getAllPublishedSourceVersions(): Promise<SourceVersionDTO[]> {
  const versions = await prisma.sourceVersion.findMany({
    where: { status: "PUBLISHED" },
    include: { legalAct: true },
  });
  return versions.map(toSourceVersionDTO);
}

export type TimelineEntry = {
  record: StatusRecordDTO;
  recordOwnerUnit: TerritorialUnitDTO;
};

/** Повна хронологія записів (усіх редакцій) для об'єкта та його предків, найновіші спочатку. */
export async function getTimelineForUnit(unitId: string): Promise<TimelineEntry[]> {
  const targetUnit = await getUnitById(unitId);
  if (!targetUnit) return [];
  const ancestors = await getAncestors(unitId);
  const unitsById = new Map<string, TerritorialUnitDTO>([
    [targetUnit.id, targetUnit],
    ...ancestors.map((a): [string, TerritorialUnitDTO] => [a.id, a]),
  ]);
  const records = await getRecordsWithRelationsForUnits([...unitsById.keys()]);

  return records
    .map((record) => ({ record, recordOwnerUnit: unitsById.get(record.territorialUnitId)! }))
    .sort((a, b) => b.record.startDate.getTime() - a.record.startDate.getTime());
}
