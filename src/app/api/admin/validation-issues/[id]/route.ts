import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

const resolveSchema = z.object({
  comment: z.string().min(3, "Коментар обов'язковий для підтвердження або відхилення."),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireRole(request, ["ADMIN", "LEGAL_VERIFIER"]);
  if (!guard.ok) return apiError(guard.reason, "Ця дія доступна лише верифікатору або адміністратору.");

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Тіло запиту має бути коректним JSON.");
  }
  const parsed = resolveSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Некоректні дані.");
  }

  const issue = await prisma.validationIssue.findUnique({ where: { id: params.id } });
  if (!issue) return apiError("NOT_FOUND", "Запис перевірки не знайдено.");
  if (issue.resolved) return apiError("CONFLICT", "Цей запис уже підтверджено.");

  const updated = await prisma.validationIssue.update({
    where: { id: params.id },
    data: { resolved: true, resolvedBy: guard.session.userId, resolvedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: guard.session.userId,
      action: "VALIDATION_ISSUE_RESOLVE",
      entityType: "ValidationIssue",
      entityId: issue.id,
      beforeJson: JSON.stringify({ resolved: false }),
      afterJson: JSON.stringify({ resolved: true }),
      comment: parsed.data.comment,
    },
  });

  return apiSuccess({ id: updated.id, resolved: updated.resolved, resolvedAt: updated.resolvedAt?.toISOString() });
}
