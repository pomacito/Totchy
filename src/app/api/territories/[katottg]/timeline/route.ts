import { apiError, apiSuccess } from "@/lib/api/response";
import { getUnitByKatottg, getTimelineForUnit } from "@/lib/rules-engine/repository";

export async function GET(_request: Request, { params }: { params: { katottg: string } }) {
  const unit = await getUnitByKatottg(params.katottg);
  if (!unit) {
    return apiError("UNIT_NOT_FOUND", "Об'єкт з таким кодом КАТОТТГ не знайдено.");
  }

  const timeline = await getTimelineForUnit(unit.id);

  return apiSuccess({
    katottg: unit.katottg,
    name: unit.name,
    timeline: timeline.map((entry) => ({
      categoryCode: entry.record.statusCategory.code,
      officialLabel: entry.record.statusCategory.officialLabel,
      startDate: entry.record.startDate.toISOString(),
      endDate: entry.record.endDate?.toISOString() ?? null,
      recordLevel: entry.record.recordLevel,
      recordOwnerUnit: { katottg: entry.recordOwnerUnit.katottg, name: entry.recordOwnerUnit.name },
      sourceVersion: entry.record.sourceVersion.label,
      isDemoData: entry.record.sourceVersion.isDemoData,
      legalAct: {
        title: entry.record.legalAct.title,
        number: entry.record.legalAct.number,
        officialUrl: entry.record.legalAct.officialUrl,
      },
      needsReview: entry.record.needsReview,
      reviewReason: entry.record.reviewReason,
    })),
  });
}
