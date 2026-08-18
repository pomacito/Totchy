import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getClientKey } from "@/lib/api/rateLimit";
import { reportRequestSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/prisma";
import { generateReport, storeGeneratedFile, ReportGenerationError } from "@/lib/reports/generate";

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`reports:${getClientKey(request)}`);
  if (!rate.allowed) {
    return apiError("RATE_LIMITED", "Забагато запитів на формування звітів. Спробуйте пізніше.");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Тіло запиту має бути коректним JSON.");
  }
  const parsed = reportRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Некоректні параметри звіту.");
  }
  const { type, format, params } = parsed.data;

  const job = await prisma.reportJob.create({
    data: { type, format, paramsJson: JSON.stringify(params), status: "PROCESSING" },
  });

  const baseUrl = process.env.APP_BASE_URL ?? request.nextUrl.origin;
  const verifyUrl = `${baseUrl}/reports/verify/${job.verifyToken}`;

  try {
    const file = await generateReport(type, format, params, verifyUrl);
    const resultKey = await storeGeneratedFile(job.id, file);
    const updated = await prisma.reportJob.update({
      where: { id: job.id },
      data: { status: "READY", resultKey, finishedAt: new Date() },
    });
    return apiSuccess(
      {
        id: updated.id,
        status: updated.status,
        type: updated.type,
        format: updated.format,
        downloadUrl: `/api/reports/${updated.id}/file`,
        verifyUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof ReportGenerationError ? err.message : "Не вдалося сформувати звіт.";
    if (!(err instanceof ReportGenerationError)) {
      // Неочікувана помилка (а не свідоме обмеження формату/типу) — логуємо
      // повний стек на сервері, користувачу повертаємо лише узагальнене повідомлення.
      console.error("Report generation failed unexpectedly:", err);
    }
    await prisma.reportJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: message, finishedAt: new Date() },
    });
    return apiError("VALIDATION_ERROR", message);
  }
}
