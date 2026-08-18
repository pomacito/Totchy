import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const guard = requireRole(request, ["ADMIN", "LEGAL_VERIFIER", "EDITOR"]);
  if (!guard.ok) return apiError(guard.reason, "Потрібна автентифікація адміністративної панелі.");

  const jobs = await prisma.importJob.findMany({
    include: {
      sourceVersion: { include: { legalAct: true } },
      validationIssues: true,
    },
    orderBy: { startedAt: "desc" },
  });

  return apiSuccess({
    items: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      startedAt: j.startedAt.toISOString(),
      finishedAt: j.finishedAt?.toISOString() ?? null,
      recordsTotal: j.recordsTotal,
      recordsChanged: j.recordsChanged,
      recordsFlagged: j.recordsFlagged,
      sourceVersion: {
        id: j.sourceVersion.id,
        label: j.sourceVersion.label,
        status: j.sourceVersion.status,
        isDemoData: j.sourceVersion.isDemoData,
        legalActTitle: j.sourceVersion.legalAct.title,
      },
      openIssues: j.validationIssues.filter((i) => !i.resolved).length,
      totalIssues: j.validationIssues.length,
    })),
  });
}
