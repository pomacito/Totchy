import { prisma } from "@/lib/prisma";
import type { TerritorialUnitType } from "@prisma/client";
import { getAncestors } from "@/lib/rules-engine/repository";
import type { TerritorialUnitDTO } from "@/lib/rules-engine/types";
import { isLatinScript, normalizeName, transliterateLatinToCyrillicGuess } from "./normalize";

export type SearchCandidate = {
  territorialUnit: TerritorialUnitDTO;
  matchedName: string;
  nameType: string;
  score: number;
  administrativePath: TerritorialUnitDTO[]; // від області/АРК до самого об'єкта
};

export type SearchFilters = {
  region?: string; // назва області/АРК
  type?: TerritorialUnitType;
  limit?: number;
};

type RawMatchRow = {
  id: string;
  territorialUnitId: string;
  name: string;
  type: string;
  score: number;
};

async function runTrigramSearch(normalizedQuery: string, limit: number): Promise<RawMatchRow[]> {
  return prisma.$queryRaw<RawMatchRow[]>`
    SELECT sn.id,
           sn."territorialUnitId",
           sn.name,
           sn.type::text as type,
           GREATEST(
             similarity(sn."nameNormalized", ${normalizedQuery}),
             CASE WHEN sn."nameNormalized" ILIKE ${normalizedQuery + "%"} THEN 1 ELSE 0 END
           ) AS score
    FROM "SettlementName" sn
    WHERE sn."nameNormalized" % ${normalizedQuery}
       OR sn."nameNormalized" ILIKE ${"%" + normalizedQuery + "%"}
    ORDER BY score DESC
    LIMIT ${limit};
  `;
}

/** Розумний пошук за назвою (сучасною, колишньою, альтернативною) з нечітким пошуком і транслітерацією. */
export async function searchByName(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchCandidate[]> {
  const limit = filters.limit ?? 20;
  const normalizedQuery = normalizeName(query);
  if (normalizedQuery.length === 0) return [];

  const queries = [normalizedQuery];
  if (isLatinScript(query)) {
    queries.push(normalizeName(transliterateLatinToCyrillicGuess(query)));
  }

  const rowsByTerritorialUnit = new Map<string, RawMatchRow>();
  for (const q of queries) {
    const rows = await runTrigramSearch(q, limit * 2);
    for (const row of rows) {
      const existing = rowsByTerritorialUnit.get(row.territorialUnitId);
      if (!existing || existing.score < row.score) {
        rowsByTerritorialUnit.set(row.territorialUnitId, row);
      }
    }
  }

  const candidateRows = [...rowsByTerritorialUnit.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit * 3); // із запасом до застосування фільтрів

  const results: SearchCandidate[] = [];
  for (const row of candidateRows) {
    const unit = await prisma.territorialUnit.findUnique({ where: { id: row.territorialUnitId } });
    if (!unit) continue;
    if (filters.type && unit.type !== filters.type) continue;

    const ancestors = await getAncestors(unit.id);
    const path = [...ancestors].reverse(); // від кореня до найближчого предка

    if (filters.region) {
      const regionMatch = path.some(
        (a) => normalizeName(a.name) === normalizeName(filters.region!)
      );
      if (!regionMatch) continue;
    }

    results.push({
      territorialUnit: unit,
      matchedName: row.name,
      nameType: row.type,
      score: row.score,
      administrativePath: [...path, unit],
    });
    if (results.length >= limit) break;
  }

  return results;
}

export async function searchByKatottg(code: string): Promise<SearchCandidate[]> {
  const trimmed = code.trim();
  if (trimmed.length === 0) return [];
  const units = await prisma.territorialUnit.findMany({
    where: { katottg: { startsWith: trimmed, mode: "insensitive" } },
    take: 20,
  });
  const results: SearchCandidate[] = [];
  for (const unit of units) {
    const ancestors = await getAncestors(unit.id);
    const path = [...ancestors].reverse();
    results.push({
      territorialUnit: unit,
      matchedName: unit.name,
      nameType: "OFFICIAL",
      score: unit.katottg.toLowerCase() === trimmed.toLowerCase() ? 1 : 0.8,
      administrativePath: [...path, unit],
    });
  }
  return results;
}

/** Об'єднує пошук за назвою та за кодом КАТОТТГ, використовується і API, і сторінками результатів. */
export async function searchCombined(query: string, filters: SearchFilters = {}): Promise<SearchCandidate[]> {
  const limit = filters.limit ?? 20;
  const looksLikeKatottg = /^[a-z0-9-]{4,}$/i.test(query.trim()) && query.trim().includes("-");

  const [byName, byKatottg] = await Promise.all([
    searchByName(query, filters),
    looksLikeKatottg ? searchByKatottg(query) : Promise.resolve([]),
  ]);

  const mergedById = new Map<string, SearchCandidate>();
  for (const c of [...byKatottg, ...byName]) {
    const existing = mergedById.get(c.territorialUnit.id);
    if (!existing || existing.score < c.score) mergedById.set(c.territorialUnit.id, c);
  }
  return [...mergedById.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Групує кандидатів за нормалізованою назвою для визначення однойменності. */
export function groupsRequiringDisambiguation(
  candidates: SearchCandidate[]
): Map<string, SearchCandidate[]> {
  const groups = new Map<string, SearchCandidate[]>();
  for (const c of candidates) {
    const key = normalizeName(c.matchedName);
    const group = groups.get(key) ?? [];
    group.push(c);
    groups.set(key, group);
  }
  const ambiguous = new Map<string, SearchCandidate[]>();
  for (const [key, group] of groups) {
    if (group.length > 1) ambiguous.set(key, group);
  }
  return ambiguous;
}
