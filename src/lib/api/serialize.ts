import type { StatusResolutionResult, TerritorialUnitDTO } from "@/lib/rules-engine/types";

function serializeUnit(unit: TerritorialUnitDTO) {
  return {
    katottg: unit.katottg,
    name: unit.name,
    type: unit.type,
    isDemoData: unit.isDemoData,
  };
}

export type ApiConfidence = "verified" | "demo_data" | "needs_review";

/**
 * Перетворює результат rules engine у публічну JSON-структуру API.
 * `confidence` стосується якості ідентифікації/валідації даних, а не
 * ймовірності правового статусу (див. ТЗ, розділ 7).
 */
export function serializeStatusResult(result: StatusResolutionResult, query?: string) {
  const base = {
    query,
    requestId: undefined as string | undefined, // додається на рівні response envelope
  };

  switch (result.outcome) {
    case "UNIT_NOT_FOUND":
      return {
        ...base,
        outcome: result.outcome,
        explanation: result.explanation,
        confidence: "verified" as ApiConfidence,
      };

    case "NO_REDACTION_FOR_DATE":
      return {
        ...base,
        outcome: result.outcome,
        asOfDate: result.asOfDate.toISOString(),
        matchedUnit: serializeUnit(result.matchedUnit),
        administrativePath: result.administrativePath.map((p) => serializeUnit(p.unit)),
        explanation: result.explanation,
        confidence: (result.matchedUnit.isDemoData ? "demo_data" : "verified") as ApiConfidence,
      };

    case "FOUND_NO_RECORD":
      return {
        ...base,
        outcome: result.outcome,
        asOfDate: result.asOfDate.toISOString(),
        matchedUnit: serializeUnit(result.matchedUnit),
        administrativePath: result.administrativePath.map((p) => serializeUnit(p.unit)),
        sourceVersion: {
          label: result.redactionSourceVersion.label,
          isDemoData: result.redactionSourceVersion.isDemoData,
        },
        evidenceChain: result.evidenceChain,
        explanation: result.explanation,
        dataUpdatedAt: result.redactionSourceVersion.publishedAt?.toISOString() ?? null,
        confidence: (result.matchedUnit.isDemoData ? "demo_data" : "verified") as ApiConfidence,
      };

    case "NEEDS_REVIEW":
      return {
        ...base,
        outcome: result.outcome,
        asOfDate: result.asOfDate.toISOString(),
        matchedUnit: serializeUnit(result.matchedUnit),
        administrativePath: result.administrativePath.map((p) => serializeUnit(p.unit)),
        conflictingCategories: result.conflictingRecords.map((r) => ({
          categoryCode: r.statusCategory.code,
          officialLabel: r.statusCategory.officialLabel,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate?.toISOString() ?? null,
          sourceExcerpt: r.sourceExcerpt,
        })),
        evidenceChain: result.evidenceChain,
        explanation: result.explanation,
        confidence: "needs_review" as ApiConfidence,
      };

    case "FOUND_STATUS":
      return {
        ...base,
        outcome: result.outcome,
        asOfDate: result.asOfDate.toISOString(),
        matchedUnit: serializeUnit(result.matchedUnit),
        administrativePath: result.administrativePath.map((p) => serializeUnit(p.unit)),
        status: {
          categoryCode: result.record.statusCategory.code,
          officialLabel: result.record.statusCategory.officialLabel,
          shortLabel: result.record.statusCategory.shortLabel,
          startDate: result.record.startDate.toISOString(),
          endDate: result.record.endDate?.toISOString() ?? null,
          isActiveOnDate: result.isActiveOnDate,
          recordLevel: result.record.recordLevel,
          appliesVia: result.appliesVia,
          recordOwnerUnit: serializeUnit(result.recordOwnerUnit),
        },
        legalBasis: [
          {
            actTitle: result.record.legalAct.title,
            actNumber: result.record.legalAct.number,
            actType: result.record.legalAct.type,
            issuingBody: result.record.legalAct.issuingBody,
            actDate: result.record.legalAct.adoptedAt.toISOString(),
            effectiveDate: result.record.legalAct.effectiveAt.toISOString(),
            officialUrl: result.record.legalAct.officialUrl,
            sourceVersion: result.redactionSourceVersion.label,
            sourceExcerpt: result.record.sourceExcerpt,
            sourceRowRef: result.record.sourceRowRef,
          },
        ],
        evidenceChain: result.evidenceChain,
        explanation: result.explanation,
        dataUpdatedAt: result.redactionSourceVersion.publishedAt?.toISOString() ?? null,
        confidence: (result.matchedUnit.isDemoData || result.redactionSourceVersion.isDemoData
          ? "demo_data"
          : "verified") as ApiConfidence,
      };
  }
}
