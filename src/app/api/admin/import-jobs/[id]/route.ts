import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireRole(request, ["ADMIN", "LEGAL_VERIFIER", "EDITOR"]);
  if (!guard.ok) return apiError(guard.reason, "Потрібна автентифікація адміністративної панелі.");

  const job = await prisma.importJob.findUnique({
    where: { id: params.id },
    include: {
      sourceVersion: { include: { legalAct: true } },
      validationIssues: { orderBy: { severity: "desc" } },
    },
  });
  if (!job) return apiError("NOT_FOUND", "Завдання імпорту не знайдено.");

  const changelog = await prisma.changelogEntry.findMany({
    where: { sourceVersionId: job.sourceVersionId },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess({
    id: job.id,
    status: job.status,
    startedAt: job.startedAt.toISOString(),
    finishedAt: job.finishedAt?.toISOString() ?? null,
    log: job.log,
    recordsTotal: job.recordsTotal,
    recordsChanged: job.recordsChanged,
    recordsFlagged: job.recordsFlagged,
    sourceVersion: {
      id: job.sourceVersion.id,
      label: job.sourceVersion.label,
      status: job.sourceVersion.status,
      isDemoData: job.sourceVersion.isDemoData,
      legalAct: {
        title: job.sourceVersion.legalAct.title,
        number: job.sourceVersion.legalAct.number,
        officialUrl: job.sourceVersion.legalAct.officialUrl,
      },
    },
    validationIssues: job.validationIssues.map((i) => ({
      id: i.id,
      severity: i.severity,
      code: i.code,
      message: i.message,
      entityRef: i.entityRef,
      resolved: i.resolved,
      resolvedBy: i.resolvedBy,
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
    })),
    changelog: changelog.map((c) => ({
      changeType: c.changeType,
      territorialUnitRef: c.territorialUnitRef,
      description: c.description,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
