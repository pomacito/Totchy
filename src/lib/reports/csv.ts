import { stringify } from "csv-stringify/sync";
import type { StatusResolutionResult } from "@/lib/rules-engine/types";

function statusRowFromResult(katottgQuery: string, result: StatusResolutionResult): Record<string, string> {
  const base = {
    Запит: katottgQuery,
    Результат: result.outcome,
  };
  if (result.outcome === "UNIT_NOT_FOUND") {
    return { ...base, Пояснення: result.explanation };
  }
  const path = result.administrativePath.map((p) => p.unit.name).join(" → ");
  if (result.outcome === "FOUND_STATUS") {
    return {
      ...base,
      "Код КАТОТТГ": result.matchedUnit.katottg,
      Назва: result.matchedUnit.name,
      "Адміністративний шлях": path,
      Категорія: result.record.statusCategory.officialLabel,
      "Дата початку": result.record.startDate.toISOString().slice(0, 10),
      "Дата завершення": result.record.endDate?.toISOString().slice(0, 10) ?? "не визначено",
      "Нормативний акт": `${result.record.legalAct.title} № ${result.record.legalAct.number}`,
      "Офіційне посилання": result.record.legalAct.officialUrl,
      "Демо-дані": result.matchedUnit.isDemoData ? "так" : "ні",
    };
  }
  if (result.outcome === "NEEDS_REVIEW") {
    return {
      ...base,
      "Код КАТОТТГ": result.matchedUnit.katottg,
      Назва: result.matchedUnit.name,
      "Адміністративний шлях": path,
      Пояснення: result.explanation,
    };
  }
  return {
    ...base,
    "Код КАТОТТГ": result.matchedUnit.katottg,
    Назва: result.matchedUnit.name,
    "Адміністративний шлях": path,
    Пояснення: result.explanation,
  };
}

export function buildStatusResultsCsv(
  items: Array<{ katottgQuery: string; result: StatusResolutionResult }>
): string {
  const rows = items.map((i) => statusRowFromResult(i.katottgQuery, i.result));
  return stringify(rows, { header: true, bom: true });
}

export function buildTimelineCsv(
  entries: Array<{
    categoryOfficialLabel: string;
    startDate: string;
    endDate: string | null;
    recordOwner: string;
    sourceVersion: string;
    legalActTitle: string;
  }>
): string {
  const rows = entries.map((e) => ({
    Категорія: e.categoryOfficialLabel,
    "Дата початку": e.startDate.slice(0, 10),
    "Дата завершення": e.endDate ? e.endDate.slice(0, 10) : "не визначено",
    "Рівень запису": e.recordOwner,
    "Редакція джерела": e.sourceVersion,
    "Нормативний акт": e.legalActTitle,
  }));
  return stringify(rows, { header: true, bom: true });
}

export function buildChangelogCsv(
  entries: Array<{ changeType: string; territorialUnitRef: string; description: string; createdAt: string }>
): string {
  const rows = entries.map((e) => ({
    "Тип зміни": e.changeType,
    Одиниця: e.territorialUnitRef,
    Опис: e.description,
    Дата: e.createdAt.slice(0, 10),
  }));
  return stringify(rows, { header: true, bom: true });
}
