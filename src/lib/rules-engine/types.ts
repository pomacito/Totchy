import type { RecordLevel, TerritorialUnitType } from "@prisma/client";

export type StatusCategoryDTO = {
  id: string;
  code: string;
  officialLabel: string;
  shortLabel: string;
  description: string;
  priority: number;
  colorToken: string;
};

export type LegalActDTO = {
  id: string;
  type: string;
  issuingBody: string;
  number: string;
  title: string;
  adoptedAt: Date;
  effectiveAt: Date;
  officialUrl: string;
};

export type SourceVersionDTO = {
  id: string;
  label: string;
  legalAct: LegalActDTO;
  publishedAt: Date | null;
  isDemoData: boolean;
};

export type TerritorialUnitDTO = {
  id: string;
  katottg: string;
  name: string;
  type: TerritorialUnitType;
  parentId: string | null;
  validFrom: Date;
  validTo: Date | null;
  isDemoData: boolean;
};

export type StatusRecordDTO = {
  id: string;
  territorialUnitId: string;
  statusCategory: StatusCategoryDTO;
  recordLevel: RecordLevel;
  startDate: Date;
  endDate: Date | null;
  sourceVersion: SourceVersionDTO;
  legalAct: LegalActDTO;
  sourceExcerpt: string | null;
  sourceRowRef: string | null;
  needsReview: boolean;
  reviewReason: string | null;
}

/** Ланцюг адміністративних предків від найконкретнішого до найзагальнішого. */
export type AdministrativePathEntry = {
  unit: TerritorialUnitDTO;
  existedOnDate: boolean;
};

export type EvidenceChainStep = {
  step:
    | "QUERY"
    | "MATCHED_UNIT"
    | "KATOTTG"
    | "ADMINISTRATIVE_PATH"
    | "SOURCE_REDACTION"
    | "STATUS_RECORD"
    | "CATEGORY"
    | "LEGAL_ACT"
    | "VERIFIED_AT";
  label: string;
  value: string;
};

export type ResolvedStatus = {
  outcome: "FOUND_STATUS";
  matchedUnit: TerritorialUnitDTO;
  administrativePath: AdministrativePathEntry[];
  record: StatusRecordDTO;
  /** Рівень запису, на якому фактично знайдено статус (може відрізнятись від рівня запитаного об'єкта). */
  appliesVia: "DIRECT" | "INHERITED";
  /** Одиниця, до записів якої безпосередньо належить `record` (сам об'єкт або предок). */
  recordOwnerUnit: TerritorialUnitDTO;
  isActiveOnDate: boolean;
  asOfDate: Date;
  redactionSourceVersion: SourceVersionDTO;
  evidenceChain: EvidenceChainStep[];
  explanation: string;
};

export type NoRecordFound = {
  outcome: "FOUND_NO_RECORD";
  matchedUnit: TerritorialUnitDTO;
  administrativePath: AdministrativePathEntry[];
  asOfDate: Date;
  redactionSourceVersion: SourceVersionDTO;
  evidenceChain: EvidenceChainStep[];
  explanation: string;
};

export type NeedsReview = {
  outcome: "NEEDS_REVIEW";
  matchedUnit: TerritorialUnitDTO;
  administrativePath: AdministrativePathEntry[];
  conflictingRecords: StatusRecordDTO[];
  asOfDate: Date;
  redactionSourceVersion: SourceVersionDTO | null;
  evidenceChain: EvidenceChainStep[];
  explanation: string;
};

export type NoRedactionForDate = {
  outcome: "NO_REDACTION_FOR_DATE";
  matchedUnit: TerritorialUnitDTO;
  administrativePath: AdministrativePathEntry[];
  asOfDate: Date;
  explanation: string;
};

export type UnitNotFound = {
  outcome: "UNIT_NOT_FOUND";
  explanation: string;
};

export type StatusResolutionResult =
  | ResolvedStatus
  | NoRecordFound
  | NeedsReview
  | NoRedactionForDate
  | UnitNotFound;

export const RECORD_LEVEL_SPECIFICITY: Record<RecordLevel, number> = {
  SETTLEMENT: 4,
  HROMADA: 3,
  RAION: 2,
  OBLAST: 1,
};
