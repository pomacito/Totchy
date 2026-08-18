import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const [versions, total] = await Promise.all([
    prisma.sourceVersion.findMany({
      where: { status: "PUBLISHED" },
      include: { legalAct: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.sourceVersion.count({ where: { status: "PUBLISHED" } }),
  ]);

  return apiSuccess({
    items: versions.map((v) => ({
      label: v.label,
      publishedAt: v.publishedAt?.toISOString() ?? null,
      isDemoData: v.isDemoData,
      legalAct: {
        title: v.legalAct.title,
        number: v.legalAct.number,
        officialUrl: v.legalAct.officialUrl,
        effectiveAt: v.legalAct.effectiveAt.toISOString(),
      },
    })),
    pagination: { limit, offset, total },
  });
}
