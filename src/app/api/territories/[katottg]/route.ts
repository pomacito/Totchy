import { apiError, apiSuccess } from "@/lib/api/response";
import { getAncestors, getUnitByKatottg } from "@/lib/rules-engine/repository";

export async function GET(_request: Request, { params }: { params: { katottg: string } }) {
  const unit = await getUnitByKatottg(params.katottg);
  if (!unit) {
    return apiError("UNIT_NOT_FOUND", "Об'єкт з таким кодом КАТОТТГ не знайдено.");
  }
  const ancestors = await getAncestors(unit.id);
  const administrativePath = [...ancestors].reverse();

  return apiSuccess({
    unit: {
      katottg: unit.katottg,
      name: unit.name,
      type: unit.type,
      isDemoData: unit.isDemoData,
      validFrom: unit.validFrom.toISOString(),
      validTo: unit.validTo?.toISOString() ?? null,
    },
    administrativePath: administrativePath.map((u) => ({
      katottg: u.katottg,
      name: u.name,
      type: u.type,
    })),
  });
}
