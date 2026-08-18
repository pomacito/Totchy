import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { compareRequestSchema } from "@/lib/validation/schemas";
import { getUnitByKatottg, resolveStatusForUnit } from "@/lib/rules-engine/repository";
import { serializeStatusResult } from "@/lib/api/serialize";

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Тіло запиту має бути коректним JSON.");
  }

  const parsed = compareRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Некоректні параметри запиту.");
  }

  const { katottgCodes, asOfDate } = parsed.data;
  const asOf = asOfDate ? new Date(asOfDate + "T00:00:00Z") : new Date();

  const items = await Promise.all(
    katottgCodes.map(async (code) => {
      const unit = await getUnitByKatottg(code);
      if (!unit) {
        return { katottgQuery: code, ...serializeStatusResult({ outcome: "UNIT_NOT_FOUND", explanation: `Об'єкт з кодом ${code} не знайдено.` }) };
      }
      const result = await resolveStatusForUnit(unit.id, asOf);
      return { katottgQuery: code, ...serializeStatusResult(result, code) };
    })
  );

  return apiSuccess({ asOfDate: asOf.toISOString(), items });
}
