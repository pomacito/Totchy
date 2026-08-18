import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getStorageDriver } from "@/lib/storage";
import { CONTENT_TYPES } from "@/lib/reports/generate";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const job = await prisma.reportJob.findUnique({ where: { id: params.id } });
  if (!job || job.status !== "READY" || !job.resultKey) {
    return apiError("NOT_FOUND", "Файл звіту недоступний.");
  }

  const buffer = await getStorageDriver().get(job.resultKey);
  const filename = job.resultKey.split("/").pop() ?? "report";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[job.format],
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
