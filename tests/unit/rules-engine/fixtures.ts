/**
 * Fixture-об'єкти для тестів rules engine. Дзеркалять демонстраційний
 * насіннєвий набір (prisma/seed/index.ts), але побудовані як прості
 * TypeScript-об'єкти, щоб unit-тести не залежали від БД. Кожен тест-кейс
 * прив'язаний до конкретної "версії" фікстури (SV1 / SV2), як того вимагає
 * стратегія тестування (regression fixtures на кілька редакцій).
 */
import type {
  LegalActDTO,
  SourceVersionDTO,
  StatusCategoryDTO,
  StatusRecordDTO,
  TerritorialUnitDTO,
} from "@/lib/rules-engine/types";

export const categories = {
  possible: {
    id: "cat-possible",
    code: "POSSIBLE_HOSTILITIES",
    officialLabel: "територія можливих бойових дій",
    shortLabel: "Можливі бойові дії",
    description: "",
    priority: 1,
    colorToken: "status-possible",
  } satisfies StatusCategoryDTO,
  active: {
    id: "cat-active",
    code: "ACTIVE_HOSTILITIES",
    officialLabel: "територія активних бойових дій",
    shortLabel: "Активні бойові дії",
    description: "",
    priority: 2,
    colorToken: "status-active",
  } satisfies StatusCategoryDTO,
  activeEres: {
    id: "cat-active-eres",
    code: "ACTIVE_HOSTILITIES_STATE_RESOURCES",
    officialLabel:
      "територія активних бойових дій, на якій функціонують державні електронні інформаційні ресурси",
    shortLabel: "Активні бойові дії (держ. е-ресурси діють)",
    description: "",
    priority: 3,
    colorToken: "status-active-eresources",
  } satisfies StatusCategoryDTO,
  occupied: {
    id: "cat-occupied",
    code: "TEMPORARILY_OCCUPIED",
    officialLabel: "тимчасово окупована територія",
    shortLabel: "Тимчасово окупована",
    description: "",
    priority: 4,
    colorToken: "status-occupied",
  } satisfies StatusCategoryDTO,
};

const actV1: LegalActDTO = {
  id: "act-v1",
  type: "ORDER",
  issuingBody: "Демонстраційне відомство",
  number: "ДЕМО-100",
  title: "Демо-редакція №1",
  adoptedAt: new Date("2024-01-10T00:00:00Z"),
  effectiveAt: new Date("2024-01-15T00:00:00Z"),
  officialUrl: "https://example.invalid/demo-act-100",
};

const actV2: LegalActDTO = {
  id: "act-v2",
  type: "ORDER",
  issuingBody: "Демонстраційне відомство",
  number: "ДЕМО-205",
  title: "Демо-редакція №2",
  adoptedAt: new Date("2024-07-01T00:00:00Z"),
  effectiveAt: new Date("2024-07-10T00:00:00Z"),
  officialUrl: "https://example.invalid/demo-act-205",
};

export const sv1: SourceVersionDTO = {
  id: "sv1",
  label: "Демо-редакція 2024-01-15",
  legalAct: actV1,
  publishedAt: new Date("2024-01-17T10:00:00Z"),
  isDemoData: true,
};

export const sv2: SourceVersionDTO = {
  id: "sv2",
  label: "Демо-редакція 2024-07-10",
  legalAct: actV2,
  publishedAt: new Date("2024-07-12T10:00:00Z"),
  isDemoData: true,
};

export const hromada: TerritorialUnitDTO = {
  id: "unit-hromada",
  katottg: "DEMO-01-01-01-HRM",
  name: "Вербівська громада",
  type: "HROMADA",
  parentId: "unit-raion",
  validFrom: new Date("2020-01-01T00:00:00Z"),
  validTo: null,
  isDemoData: true,
};

export const raion: TerritorialUnitDTO = {
  id: "unit-raion",
  katottg: "DEMO-01-01-00-RAI",
  name: "Прикордонний район",
  type: "RAION",
  parentId: "unit-oblast",
  validFrom: new Date("2020-01-01T00:00:00Z"),
  validTo: null,
  isDemoData: true,
};

export const oblast: TerritorialUnitDTO = {
  id: "unit-oblast",
  katottg: "DEMO-01-00-00-OBL",
  name: "Затіссянська область",
  type: "OBLAST",
  parentId: null,
  validFrom: new Date("2020-01-01T00:00:00Z"),
  validTo: null,
  isDemoData: true,
};

export const citySettlement: TerritorialUnitDTO = {
  id: "unit-city",
  katottg: "DEMO-01-01-01-CTY1",
  name: "Вербівка",
  type: "CITY",
  parentId: "unit-hromada",
  validFrom: new Date("2020-01-01T00:00:00Z"),
  validTo: null,
  isDemoData: true,
};

export const villageSettlement: TerritorialUnitDTO = {
  id: "unit-village",
  katottg: "DEMO-01-01-01-VLG1",
  name: "Затишне",
  type: "VILLAGE",
  parentId: "unit-hromada",
  validFrom: new Date("2020-01-01T00:00:00Z"),
  validTo: null,
  isDemoData: true,
};

export const conflictHromada: TerritorialUnitDTO = {
  id: "unit-conflict-hromada",
  katottg: "DEMO-01-01-02-HRM",
  name: "Конфліктна громада",
  type: "HROMADA",
  parentId: "unit-raion",
  validFrom: new Date("2020-01-01T00:00:00Z"),
  validTo: null,
  isDemoData: true,
};

function rec(partial: Partial<StatusRecordDTO> & Pick<StatusRecordDTO, "territorialUnitId" | "statusCategory" | "recordLevel" | "startDate" | "endDate" | "sourceVersion" | "legalAct">): StatusRecordDTO {
  return {
    id: `rec-${Math.random().toString(36).slice(2)}`,
    sourceExcerpt: null,
    sourceRowRef: null,
    needsReview: false,
    reviewReason: null,
    ...partial,
  };
}

export const hromadaRecordSv1 = rec({
  territorialUnitId: hromada.id,
  statusCategory: categories.occupied,
  recordLevel: "HROMADA",
  startDate: new Date("2022-03-15T00:00:00Z"),
  endDate: null,
  sourceVersion: sv1,
  legalAct: actV1,
});

export const hromadaRecordSv2 = rec({
  territorialUnitId: hromada.id,
  statusCategory: categories.occupied,
  recordLevel: "HROMADA",
  startDate: new Date("2022-03-15T00:00:00Z"),
  endDate: null,
  sourceVersion: sv2,
  legalAct: actV2,
});

// Вікно точкового запису навмисно лежить у межах періоду дії SV1
// (з 2024-01-15 до набуття чинності SV2 2024-07-10), інакше запит "станом
// на дату" в цьому вікні не матиме жодної застосовної редакції джерела.
export const cityRecordSv1 = rec({
  territorialUnitId: citySettlement.id,
  statusCategory: categories.activeEres,
  recordLevel: "SETTLEMENT",
  startDate: new Date("2024-02-01T00:00:00Z"),
  endDate: new Date("2024-04-01T00:00:00Z"),
  sourceVersion: sv1,
  legalAct: actV1,
});

export const conflictRecordA = rec({
  territorialUnitId: conflictHromada.id,
  statusCategory: categories.active,
  recordLevel: "HROMADA",
  startDate: new Date("2024-03-01T00:00:00Z"),
  endDate: null,
  sourceVersion: sv2,
  legalAct: actV2,
  needsReview: true,
});

export const conflictRecordB = rec({
  territorialUnitId: conflictHromada.id,
  statusCategory: categories.possible,
  recordLevel: "HROMADA",
  startDate: new Date("2024-03-01T00:00:00Z"),
  endDate: null,
  sourceVersion: sv2,
  legalAct: actV2,
  needsReview: true,
});
