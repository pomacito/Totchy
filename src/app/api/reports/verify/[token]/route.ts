import { apiError, apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const job = await prisma.reportJob.findUnique({ where: { verifyToken: params.token } });
  if (!job) {
    return apiError("NOT_FOUND", "Звіт із таким кодом перевірки не знайдено.");
  }
  return apiSuccess({
    valid: true,
    type: job.type,
    format: job.format,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    paramsJson: job.paramsJson,
  });
}
