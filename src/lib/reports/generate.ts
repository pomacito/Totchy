import { prisma } from "@/lib/prisma";
import { getUnitByKatottg, resolveStatusForUnit } from "@/lib/rules-engine/repository";
import { getStorageDriver } from "@/lib/storage";
import { buildChangelogCsv, buildStatusResultsCsv } from "./csv";
import { renderSingleTerritoryPdf } from "./pdf";
import type { ReportFormat, ReportType } from "@prisma/client";

export type GeneratedFile = { buffer: Buffer; contentType: string; extension: string };

export class ReportGenerationError extends Error {}

export const CONTENT_TYPES: Record<ReportFormat, string> = {
  PDF: "application/pdf",
  CSV: "text/csv; charset=utf-8",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  HTML: "text/html; charset=utf-8",
};

const EXTENSIONS: Record<ReportFormat, string> = { PDF: "pdf", CSV: "csv", XLSX: "xlsx", HTML: "html" };

export async function generateReport(
  type: ReportType,
  format: ReportFormat,
  params: Record<string, unknown>,
  verifyUrl: string
): Promise<GeneratedFile> {
  if (format === "XLSX") {
    throw new ReportGenerationError(
      "Формат XLSX заплановано на другу чергу розробки (за межами поточного MVP) — див. docs/KNOWN_LIMITATIONS.md."
    );
  }

  switch (type) {
    case "SINGLE_TERRITORY":
      return generateSingleTerritory(params, format, verifyUrl);
    case "COMPARISON":
      return generateComparison(params, format);
    case "UPDATE_LOG":
      return generateUpdateLog(format);
    case "VERSION_DIFF":
      return generateUpdateLog(format); // MVP: журнал змін використовується і як звіт про diff редакцій
    case "REGIONAL":
    case "ANALYTICS_PERIOD":
      throw new ReportGenerationError(
        `Тип звіту ${type} заплановано на подальшу ітерацію — наразі підтримуються SINGLE_TERRITORY, COMPARISON, UPDATE_LOG, VERSION_DIFF.`
      );
  }
}

async function generateSingleTerritory(
  params: Record<string, unknown>,
  format: ReportFormat,
  verifyUrl: string
): Promise<GeneratedFile> {
  const katottg = String(params.katottg ?? "");
  const asOfParam = typeof params.asOfDate === "string" ? params.asOfDate : null;
  const asOfDate = asOfParam ? new Date(asOfParam + "T00:00:00Z") : new Date();

  const unit = await getUnitByKatottg(katottg);
  const result = unit
    ? await resolveStatusForUnit(unit.id, asOfDate)
    : ({ outcome: "UNIT_NOT_FOUND", explanation: `Об'єкт з кодом ${katottg} не знайдено.` } as const);

  if (format === "PDF") {
    const buffer = await renderSingleTerritoryPdf({ result, query: katottg, generatedAt: new Date(), verifyUrl });
    return { buffer, contentType: CONTENT_TYPES.PDF, extension: EXTENSIONS.PDF };
  }

  const csv = buildStatusResultsCsv([{ katottgQuery: katottg, result }]);
  return { buffer: Buffer.from(csv, "utf-8"), contentType: CONTENT_TYPES.CSV, extension: EXTENSIONS.CSV };
}

async function generateComparison(params: Record<string, unknown>, format: ReportFormat): Promise<GeneratedFile> {
  const codes = Array.isArray(params.katottgCodes) ? (params.katottgCodes as string[]) : [];
  const asOfParam = typeof params.asOfDate === "string" ? params.asOfDate : null;
  const asOfDate = asOfParam ? new Date(asOfParam + "T00:00:00Z") : new Date();

  const items = await Promise.all(
    codes.map(async (code) => {
      const unit = await getUnitByKatottg(code);
      const result = unit
        ? await resolveStatusForUnit(unit.id, asOfDate)
        : ({ outcome: "UNIT_NOT_FOUND", explanation: `Об'єкт з кодом ${code} не знайдено.` } as const);
      return { katottgQuery: code, result };
    })
  );

  if (format === "PDF") {
    throw new ReportGenerationError("PDF для порівняльного звіту заплановано на подальшу ітерацію; наразі доступний формат CSV.");
  }

  const csv = buildStatusResultsCsv(items);
  return { buffer: Buffer.from(csv, "utf-8"), contentType: CONTENT_TYPES.CSV, extension: EXTENSIONS.CSV };
}

async function generateUpdateLog(format: ReportFormat): Promise<GeneratedFile> {
  if (format === "PDF") {
    throw new ReportGenerationError("PDF для журналу оновлень заплановано на подальшу ітерацію; наразі доступний формат CSV.");
  }
  const entries = await prisma.changelogEntry.findMany({ orderBy: { createdAt: "desc" } });
  const csv = buildChangelogCsv(
    entries.map((e) => ({
      changeType: e.changeType,
      territorialUnitRef: e.territorialUnitRef,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
    }))
  );
  return { buffer: Buffer.from(csv, "utf-8"), contentType: CONTENT_TYPES.CSV, extension: EXTENSIONS.CSV };
}

export async function storeGeneratedFile(reportJobId: string, file: GeneratedFile): Promise<string> {
  const key = `reports/${reportJobId}.${file.extension}`;
  await getStorageDriver().put(key, file.buffer, file.contentType);
  return key;
}
