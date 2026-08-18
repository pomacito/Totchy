import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getUnitByKatottg, resolveStatusForUnit } from "@/lib/rules-engine/repository";
import { serializeStatusResult } from "@/lib/api/serialize";
import { isoDateSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest, { params }: { params: { katottg: string } }) {
  const asOfParam = request.nextUrl.searchParams.get("asOf");
  let asOfDate = new Date();
  if (asOfParam) {
    const parsed = isoDateSchema.safeParse(asOfParam);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Параметр asOf має бути датою у форматі YYYY-MM-DD.");
    }
    asOfDate = new Date(asOfParam + "T00:00:00Z");
  }

  const unit = await getUnitByKatottg(params.katottg);
  if (!unit) {
    return apiError("UNIT_NOT_FOUND", "Об'єкт з таким кодом КАТОТТГ не знайдено.");
  }

  const result = await resolveStatusForUnit(unit.id, asOfDate);
  const body = serializeStatusResult(result, params.katottg);

  return apiSuccess(body, {
    headers: { "Last-Modified": new Date().toUTCString() },
  });
}
