import { apiError, apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const job = await prisma.reportJob.findUnique({ where: { id: params.id } });
  if (!job) {
    return apiError("NOT_FOUND", "Звіт не знайдено.");
  }
  return apiSuccess({
    id: job.id,
    type: job.type,
    format: job.format,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    finishedAt: job.finishedAt?.toISOString() ?? null,
    error: job.error,
    downloadUrl: job.status === "READY" ? `/api/reports/${job.id}/file` : null,
    verifyUrl: `${process.env.APP_BASE_URL ?? ""}/reports/verify/${job.verifyToken}`,
  });
}
