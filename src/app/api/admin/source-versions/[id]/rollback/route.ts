import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

const rollbackSchema = z.object({
  comment: z.string().min(3, "Обґрунтування відкату обов'язкове."),
  confirm: z.literal(true, { errorMap: () => ({ message: "Потрібне явне підтвердження (confirm: true)." }) }),
});

/**
 * Спрощений rollback для MVP: позначає редакцію ROLLED_BACK, після чого
 * rules engine перестає її враховувати як PUBLISHED (історія записів не
 * видаляється — жоден рядок не стирається, лише статус версії змінюється).
 *
 * Відоме обмеження: повноцінне подвійне погодження критичних змін
 * (незалежне підтвердження другою особою до виконання відкату) не
 * реалізоване в цьому MVP — тут одна роль ADMIN виконує дію одноосібно.
 * Задокументовано в docs/KNOWN_LIMITATIONS.md.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireRole(request, ["ADMIN"]);
  if (!guard.ok) return apiError(guard.reason, "Відкат редакції доступний лише адміністратору.");

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Тіло запиту має бути коректним JSON.");
  }
  const parsed = rollbackSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Некоректні дані.");
  }

  const version = await prisma.sourceVersion.findUnique({ where: { id: params.id } });
  if (!version) return apiError("NOT_FOUND", "Редакцію джерела не знайдено.");
  if (version.status !== "PUBLISHED") {
    return apiError("CONFLICT", "Відкотити можна лише опубліковану редакцію.");
  }

  const updated = await prisma.sourceVersion.update({
    where: { id: params.id },
    data: { status: "ROLLED_BACK" },
  });

  await prisma.auditLog.create({
    data: {
      userId: guard.session.userId,
      action: "SOURCE_VERSION_ROLLBACK",
      entityType: "SourceVersion",
      entityId: version.id,
      beforeJson: JSON.stringify({ status: "PUBLISHED" }),
      afterJson: JSON.stringify({ status: "ROLLED_BACK" }),
      comment: parsed.data.comment,
    },
  });

  return apiSuccess({ id: updated.id, status: updated.status });
}
