import {
  RECORD_LEVEL_SPECIFICITY,
  type AdministrativePathEntry,
  type StatusRecordDTO,
  type StatusResolutionResult,
  type TerritorialUnitDTO,
  type SourceVersionDTO,
  type EvidenceChainStep,
} from "./types";

/**
 * Детермінований рушій визначення правового статусу території.
 *
 * Сформульований пріоритет (задокументовано в docs/DECISION_LOG.md,
 * покритий тестами в tests/unit/rules-engine):
 *
 * 1. Для обраної дати обирається редакція джерела, чинна на цю дату —
 *    найновіша опублікована редакція, чий нормативний акт набрав чинності
 *    не пізніше запитаної дати. Якщо такої немає — статус на цю дату
 *    невизначений (NO_REDACTION_FOR_DATE), а не "не окуповано".
 * 2. У межах обраної редакції шукаються записи статусу для самого об'єкта
 *    та для кожного його адміністративного предка (громада, район,
 *    область/АРК), чинні на запитану дату (startDate <= дата <=
 *    endDate або endDate = null).
 * 3. Якщо запис знайдено на кількох рівнях одночасно (напр. і для
 *    населеного пункту, і для громади), перемагає найконкретніший рівень
 *    (SETTLEMENT > HROMADA > RAION > OBLAST) — точковий запис про сам
 *    об'єкт має пріоритет над успадкованим від громади.
 * 4. Якщо на найконкретнішому рівні, де знайдено записи, є кілька записів
 *    із різними категоріями, чинними одночасно — це конфлікт, і рушій не
 *    обирає один із них довільно: результат позначається NEEDS_REVIEW.
 */

export type EngineInput = {
  targetUnit: TerritorialUnitDTO | null;
  /** Ланцюг предків від батька цільового об'єкта до кореня (область/АРК), без самого об'єкта. */
  ancestors: TerritorialUnitDTO[];
  /** Усі опубліковані редакції джерела, що можуть містити записи для цього об'єкта чи предків, з датами набуття чинності. */
  candidateSourceVersions: SourceVersionDTO[];
  /** Усі записи статусу для цільового об'єкта та його предків, з усіх кандидатних редакцій. */
  records: StatusRecordDTO[];
  asOfDate: Date;
};

function selectRedactionForDate(
  versions: SourceVersionDTO[],
  asOfDate: Date
): SourceVersionDTO | null {
  const eligible = versions
    .filter((v) => v.legalAct.effectiveAt.getTime() <= asOfDate.getTime())
    .sort((a, b) => b.legalAct.effectiveAt.getTime() - a.legalAct.effectiveAt.getTime());
  return eligible[0] ?? null;
}

function isRecordActiveOnDate(record: StatusRecordDTO, asOfDate: Date): boolean {
  const t = asOfDate.getTime();
  if (record.startDate.getTime() > t) return false;
  if (record.endDate && record.endDate.getTime() < t) return false;
  return true;
}

function buildAdministrativePath(
  targetUnit: TerritorialUnitDTO,
  ancestors: TerritorialUnitDTO[],
  asOfDate: Date
): AdministrativePathEntry[] {
  const chain = [targetUnit, ...ancestors];
  return chain.map((unit) => ({
    unit,
    existedOnDate:
      unit.validFrom.getTime() <= asOfDate.getTime() &&
      (!unit.validTo || unit.validTo.getTime() >= asOfDate.getTime()),
  }));
}

function formatPathLabel(targetUnit: TerritorialUnitDTO, ancestors: TerritorialUnitDTO[]): string {
  return [targetUnit, ...ancestors].map((u) => u.name).join(" → ");
}

export function resolveStatus(input: EngineInput): StatusResolutionResult {
  const { targetUnit, ancestors, candidateSourceVersions, records, asOfDate } = input;

  if (!targetUnit) {
    return {
      outcome: "UNIT_NOT_FOUND",
      explanation:
        "Об'єкт не знайдено у довіднику адміністративно-територіальних одиниць за наданим ідентифікатором.",
    };
  }

  const administrativePath = buildAdministrativePath(targetUnit, ancestors, asOfDate);
  const pathLabel = formatPathLabel(targetUnit, ancestors);

  const redaction = selectRedactionForDate(candidateSourceVersions, asOfDate);

  const baseEvidence: EvidenceChainStep[] = [
    { step: "MATCHED_UNIT", label: "Ідентифікований об'єкт", value: targetUnit.name },
    { step: "KATOTTG", label: "Код КАТОТТГ", value: targetUnit.katottg },
    { step: "ADMINISTRATIVE_PATH", label: "Адміністративний шлях", value: pathLabel },
  ];

  if (!redaction) {
    return {
      outcome: "NO_REDACTION_FOR_DATE",
      matchedUnit: targetUnit,
      administrativePath,
      asOfDate,
      explanation:
        "На обрану дату жодна редакція нормативної бази ще не набрала чинності, тому визначити статус неможливо. " +
        "Це не означає відсутність статусу — це означає відсутність застосовної редакції джерела на цю дату.",
    };
  }

  const evidenceWithRedaction: EvidenceChainStep[] = [
    ...baseEvidence,
    {
      step: "SOURCE_REDACTION",
      label: "Застосована редакція джерела",
      value: `${redaction.label} (чинна з ${redaction.legalAct.effectiveAt.toISOString().slice(0, 10)})`,
    },
  ];

  // Захисний фільтр: рушій довіряє лише записам, що справді належать цільовому
  // об'єкту чи його предкам, навіть якщо викликач передав ширший набір.
  const relevantUnitIds = new Set([targetUnit.id, ...ancestors.map((a) => a.id)]);
  const recordsInRedaction = records.filter(
    (r) => r.sourceVersion.id === redaction.id && relevantUnitIds.has(r.territorialUnitId)
  );
  const activeRecords = recordsInRedaction.filter((r) => isRecordActiveOnDate(r, asOfDate));

  if (activeRecords.length === 0) {
    return {
      outcome: "FOUND_NO_RECORD",
      matchedUnit: targetUnit,
      administrativePath,
      asOfDate,
      redactionSourceVersion: redaction,
      evidenceChain: evidenceWithRedaction,
      explanation:
        "Об'єкт та його адміністративні предки не знайдені у відповідному розділі чинної на обрану дату редакції " +
        "Переліку. Це означає, що станом на цю дату немає підстав відносити об'єкт до жодної з офіційних категорій " +
        "— а не те, що це підтверджено окремим записом про відсутність статусу.",
    };
  }

  const maxSpecificity = Math.max(
    ...activeRecords.map((r) => RECORD_LEVEL_SPECIFICITY[r.recordLevel])
  );
  const mostSpecificRecords = activeRecords.filter(
    (r) => RECORD_LEVEL_SPECIFICITY[r.recordLevel] === maxSpecificity
  );

  const distinctCategories = new Set(mostSpecificRecords.map((r) => r.statusCategory.code));

  if (mostSpecificRecords.length > 1 && distinctCategories.size > 1) {
    return {
      outcome: "NEEDS_REVIEW",
      matchedUnit: targetUnit,
      administrativePath,
      conflictingRecords: mostSpecificRecords,
      asOfDate,
      redactionSourceVersion: redaction,
      evidenceChain: evidenceWithRedaction,
      explanation:
        "Знайдено кілька одночасно чинних записів з різними категоріями статусу на однаковому рівні " +
        "конкретності. Рушій не обирає один із них довільно — запис потребує ручної перевірки.",
    };
  }

  const record = mostSpecificRecords[0]!;
  const recordOwnerUnit =
    record.territorialUnitId === targetUnit.id
      ? targetUnit
      : ancestors.find((a) => a.id === record.territorialUnitId)!;

  const appliesVia: "DIRECT" | "INHERITED" =
    record.territorialUnitId === targetUnit.id ? "DIRECT" : "INHERITED";

  const explanation =
    appliesVia === "DIRECT"
      ? `Об'єкт «${targetUnit.name}» безпосередньо внесений до Переліку в категорії «${record.statusCategory.shortLabel}».`
      : `Запис Переліку наведений на рівні «${recordOwnerUnit.name}» (${recordLevelLabel(record.recordLevel)}). ` +
        `Статус об'єкта «${targetUnit.name}» визначено через його належність до цієї одиниці.`;

  return {
    outcome: "FOUND_STATUS",
    matchedUnit: targetUnit,
    administrativePath,
    record,
    appliesVia,
    recordOwnerUnit,
    isActiveOnDate: true,
    asOfDate,
    redactionSourceVersion: redaction,
    evidenceChain: [
      ...evidenceWithRedaction,
      { step: "STATUS_RECORD", label: "Запис Переліку", value: recordOwnerUnit.name },
      { step: "CATEGORY", label: "Категорія", value: record.statusCategory.officialLabel },
      {
        step: "LEGAL_ACT",
        label: "Нормативний акт",
        value: `${record.legalAct.title} № ${record.legalAct.number} від ${record.legalAct.adoptedAt.toISOString().slice(0, 10)}`,
      },
    ],
    explanation,
  };
}

function recordLevelLabel(level: StatusRecordDTO["recordLevel"]): string {
  switch (level) {
    case "SETTLEMENT":
      return "населений пункт";
    case "HROMADA":
      return "територіальна громада";
    case "RAION":
      return "район";
    case "OBLAST":
      return "область/АРК";
  }
}
