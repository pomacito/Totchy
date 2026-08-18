import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const [acts, total] = await Promise.all([
    prisma.legalAct.findMany({
      orderBy: { effectiveAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.legalAct.count(),
  ]);

  return apiSuccess({
    items: acts.map((a) => ({
      type: a.type,
      issuingBody: a.issuingBody,
      number: a.number,
      title: a.title,
      adoptedAt: a.adoptedAt.toISOString(),
      effectiveAt: a.effectiveAt.toISOString(),
      officialUrl: a.officialUrl,
      status: a.status,
    })),
    pagination: { limit, offset, total },
  });
}
