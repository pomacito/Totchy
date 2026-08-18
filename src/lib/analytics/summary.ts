import { prisma } from "@/lib/prisma";
import { resolveStatusForUnit } from "@/lib/rules-engine/repository";

const REPORTABLE_TYPES = ["HROMADA", "CITY", "TOWN", "VILLAGE", "URBAN_SETTLEMENT"] as const;

export type AnalyticsSummary = {
  asOfDate: string;
  totalUnitsConsidered: number;
  byCategory: Array<{ categoryCode: string; label: string; count: number }>;
  byOblast: Array<{ oblastName: string; total: number; byCategory: Record<string, number> }>;
  withoutEndDate: number;
  withEndDate: number;
  needsReviewCount: number;
  noRecordCount: number;
  recentChangelogEntries: Array<{ changeType: string; description: string; createdAt: string }>;
  dataQuality: { validationIssuesOpen: number; validationIssuesResolved: number };
};

/**
 * Обчислює аналітику "з нуля" застосуванням rules engine до кожної
 * звітної одиниці станом на дату. Для невеликого демонстраційного набору
 * це прийнятно за продуктивністю; для реального масштабу варто замінити
 * на матеріалізовану проєкцію, що оновлюється при публікації редакції
 * (задокументовано як відома оптимізація в docs/KNOWN_LIMITATIONS.md).
 */
export async function computeAnalyticsSummary(asOfDate: Date): Promise<AnalyticsSummary> {
  const units = await prisma.territorialUnit.findMany({
    where: { type: { in: [...REPORTABLE_TYPES] } },
  });

  const byCategory = new Map<string, { label: string; count: number }>();
  const byOblast = new Map<string, { total: number; byCategory: Record<string, number> }>();
  let withoutEndDate = 0;
  let withEndDate = 0;
  let needsReviewCount = 0;
  let noRecordCount = 0;

  for (const unit of units) {
    const result = await resolveStatusForUnit(unit.id, asOfDate);
    if (result.outcome === "NEEDS_REVIEW") {
      needsReviewCount += 1;
      continue;
    }
    if (result.outcome !== "FOUND_STATUS") {
      noRecordCount += 1;
      continue;
    }

    const code = result.record.statusCategory.code;
    const label = result.record.statusCategory.shortLabel;
    const current = byCategory.get(code) ?? { label, count: 0 };
    current.count += 1;
    byCategory.set(code, current);

    if (result.record.endDate) withEndDate += 1;
    else withoutEndDate += 1;

    const oblast = result.administrativePath.find((p) => p.unit.type === "OBLAST" || p.unit.type === "AR_CRIMEA");
    if (oblast) {
      const entry = byOblast.get(oblast.unit.name) ?? { total: 0, byCategory: {} };
      entry.total += 1;
      entry.byCategory[code] = (entry.byCategory[code] ?? 0) + 1;
      byOblast.set(oblast.unit.name, entry);
    }
  }

  const [openIssues, resolvedIssues, changelog] = await Promise.all([
    prisma.validationIssue.count({ where: { resolved: false } }),
    prisma.validationIssue.count({ where: { resolved: true } }),
    prisma.changelogEntry.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return {
    asOfDate: asOfDate.toISOString(),
    totalUnitsConsidered: units.length,
    byCategory: [...byCategory.entries()].map(([categoryCode, v]) => ({
      categoryCode,
      label: v.label,
      count: v.count,
    })),
    byOblast: [...byOblast.entries()].map(([oblastName, v]) => ({ oblastName, ...v })),
    withoutEndDate,
    withEndDate,
    needsReviewCount,
    noRecordCount,
    recentChangelogEntries: changelog.map((c) => ({
      changeType: c.changeType,
      description: c.description,
      createdAt: c.createdAt.toISOString(),
    })),
    dataQuality: { validationIssuesOpen: openIssues, validationIssuesResolved: resolvedIssues },
  };
}
