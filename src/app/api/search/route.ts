import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getClientKey } from "@/lib/api/rateLimit";
import { searchQuerySchema } from "@/lib/validation/schemas";
import { groupsRequiringDisambiguation, searchCombined } from "@/lib/search/repository";

export async function GET(request: NextRequest) {
  const clientKey = getClientKey(request);
  const rate = checkRateLimit(`search:${clientKey}`);
  if (!rate.allowed) {
    return apiError("RATE_LIMITED", "Забагато запитів. Спробуйте пізніше.");
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = searchQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Некоректні параметри запиту.");
  }
  const { q, region, type, limit } = parsed.data;

  const results = await searchCombined(q, { region, type, limit });
  const ambiguousGroups = groupsRequiringDisambiguation(results);

  return apiSuccess({
    query: q,
    results: results.map((r) => ({
      katottg: r.territorialUnit.katottg,
      name: r.territorialUnit.name,
      type: r.territorialUnit.type,
      matchedName: r.matchedName,
      nameType: r.nameType,
      score: r.score,
      isDemoData: r.territorialUnit.isDemoData,
      administrativePath: r.administrativePath.map((u) => ({ katottg: u.katottg, name: u.name, type: u.type })),
    })),
    requiresDisambiguation: ambiguousGroups.size > 0,
    ambiguousNames: [...ambiguousGroups.keys()],
  });
}
