import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { isoDateSchema } from "@/lib/validation/schemas";
import { computeAnalyticsSummary } from "@/lib/analytics/summary";

export async function GET(request: NextRequest) {
  const asOfParam = request.nextUrl.searchParams.get("asOf");
  let asOfDate = new Date();
  if (asOfParam) {
    const parsed = isoDateSchema.safeParse(asOfParam);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Параметр asOf має бути датою у форматі YYYY-MM-DD.");
    }
    asOfDate = new Date(asOfParam + "T00:00:00Z");
  }

  const summary = await computeAnalyticsSummary(asOfDate);
  return apiSuccess(summary);
}
