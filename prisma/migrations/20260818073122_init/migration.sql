-- CreateEnum
CREATE TYPE "LegalActType" AS ENUM ('RESOLUTION', 'ORDER', 'LAW', 'DECREE', 'OTHER');

-- CreateEnum
CREATE TYPE "LegalActStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'REPEALED');

-- CreateEnum
CREATE TYPE "SourceVersionStatus" AS ENUM ('IMPORTED', 'VALIDATING', 'VALIDATED', 'REJECTED', 'PUBLISHED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "TerritorialUnitType" AS ENUM ('AR_CRIMEA', 'OBLAST', 'RAION', 'HROMADA', 'CITY', 'TOWN', 'VILLAGE', 'URBAN_SETTLEMENT', 'CITY_DISTRICT');

-- CreateEnum
CREATE TYPE "NameType" AS ENUM ('OFFICIAL', 'FORMER', 'ALTERNATIVE', 'TRANSLITERATION');

-- CreateEnum
CREATE TYPE "RecordLevel" AS ENUM ('SETTLEMENT', 'HROMADA', 'RAION', 'OBLAST');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'FETCHING', 'PARSING', 'VALIDATING', 'AWAITING_REVIEW', 'PUBLISHED', 'REJECTED', 'ROLLED_BACK', 'FAILED');

-- CreateEnum
CREATE TYPE "ValidationSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EDITOR', 'LEGAL_VERIFIER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('SINGLE_TERRITORY', 'COMPARISON', 'REGIONAL', 'VERSION_DIFF', 'ANALYTICS_PERIOD', 'UPDATE_LOG');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'XLSX', 'CSV', 'HTML');

-- CreateEnum
CREATE TYPE "ReportJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "LegalAct" (
    "id" TEXT NOT NULL,
    "type" "LegalActType" NOT NULL,
    "issuingBody" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "adoptedAt" TIMESTAMP(3) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "officialUrl" TEXT NOT NULL,
    "documentSha256" TEXT,
    "status" "LegalActStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalAct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceVersion" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "legalActId" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "status" "SourceVersionStatus" NOT NULL DEFAULT 'IMPORTED',
    "publishedAt" TIMESTAMP(3),
    "supersedesId" TEXT,
    "isDemoData" BOOLEAN NOT NULL DEFAULT false,
    "rawFileKey" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "officialLabel" TEXT NOT NULL,
    "shortLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "colorToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerritorialUnit" (
    "id" TEXT NOT NULL,
    "katottg" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TerritorialUnitType" NOT NULL,
    "parentId" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isDemoData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerritorialUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementName" (
    "id" TEXT NOT NULL,
    "territorialUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "type" "NameType" NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerritoryStatusRecord" (
    "id" TEXT NOT NULL,
    "territorialUnitId" TEXT NOT NULL,
    "statusCategoryId" TEXT NOT NULL,
    "recordLevel" "RecordLevel" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "sourceVersionId" TEXT NOT NULL,
    "legalActId" TEXT NOT NULL,
    "sourceExcerpt" TEXT,
    "sourceRowRef" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerritoryStatusRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "sourceVersionId" TEXT NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "triggeredBy" TEXT,
    "log" TEXT,
    "recordsTotal" INTEGER,
    "recordsChanged" INTEGER,
    "recordsFlagged" INTEGER,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationIssue" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "severity" "ValidationSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityRef" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangelogEntry" (
    "id" TEXT NOT NULL,
    "sourceVersionId" TEXT NOT NULL,
    "legalActId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "territorialUnitRef" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangelogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportJob" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "paramsJson" TEXT NOT NULL,
    "status" "ReportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "requestedBy" TEXT,
    "resultKey" TEXT,
    "verifyToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "ReportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "territorialUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalAct_status_idx" ON "LegalAct"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LegalAct_type_number_adoptedAt_key" ON "LegalAct"("type", "number", "adoptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SourceVersion_supersedesId_key" ON "SourceVersion"("supersedesId");

-- CreateIndex
CREATE INDEX "SourceVersion_status_idx" ON "SourceVersion"("status");

-- CreateIndex
CREATE INDEX "SourceVersion_isDemoData_idx" ON "SourceVersion"("isDemoData");

-- CreateIndex
CREATE UNIQUE INDEX "StatusCategory_code_key" ON "StatusCategory"("code");

-- CreateIndex
CREATE INDEX "TerritorialUnit_katottg_idx" ON "TerritorialUnit"("katottg");

-- CreateIndex
CREATE INDEX "TerritorialUnit_type_idx" ON "TerritorialUnit"("type");

-- CreateIndex
CREATE INDEX "TerritorialUnit_parentId_idx" ON "TerritorialUnit"("parentId");

-- CreateIndex
CREATE INDEX "SettlementName_territorialUnitId_idx" ON "SettlementName"("territorialUnitId");

-- CreateIndex
CREATE INDEX "SettlementName_nameNormalized_idx" ON "SettlementName"("nameNormalized");

-- CreateIndex
CREATE INDEX "TerritoryStatusRecord_territorialUnitId_startDate_idx" ON "TerritoryStatusRecord"("territorialUnitId", "startDate");

-- CreateIndex
CREATE INDEX "TerritoryStatusRecord_sourceVersionId_idx" ON "TerritoryStatusRecord"("sourceVersionId");

-- CreateIndex
CREATE INDEX "TerritoryStatusRecord_needsReview_idx" ON "TerritoryStatusRecord"("needsReview");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ValidationIssue_importJobId_idx" ON "ValidationIssue"("importJobId");

-- CreateIndex
CREATE INDEX "ValidationIssue_severity_idx" ON "ValidationIssue"("severity");

-- CreateIndex
CREATE INDEX "ChangelogEntry_sourceVersionId_idx" ON "ChangelogEntry"("sourceVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportJob_verifyToken_key" ON "ReportJob"("verifyToken");

-- CreateIndex
CREATE INDEX "ReportJob_status_idx" ON "ReportJob"("status");

-- CreateIndex
CREATE INDEX "Subscription_territorialUnitId_idx" ON "Subscription"("territorialUnitId");

-- AddForeignKey
ALTER TABLE "SourceVersion" ADD CONSTRAINT "SourceVersion_legalActId_fkey" FOREIGN KEY ("legalActId") REFERENCES "LegalAct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceVersion" ADD CONSTRAINT "SourceVersion_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "SourceVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerritorialUnit" ADD CONSTRAINT "TerritorialUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TerritorialUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementName" ADD CONSTRAINT "SettlementName_territorialUnitId_fkey" FOREIGN KEY ("territorialUnitId") REFERENCES "TerritorialUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerritoryStatusRecord" ADD CONSTRAINT "TerritoryStatusRecord_territorialUnitId_fkey" FOREIGN KEY ("territorialUnitId") REFERENCES "TerritorialUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerritoryStatusRecord" ADD CONSTRAINT "TerritoryStatusRecord_statusCategoryId_fkey" FOREIGN KEY ("statusCategoryId") REFERENCES "StatusCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerritoryStatusRecord" ADD CONSTRAINT "TerritoryStatusRecord_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "SourceVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerritoryStatusRecord" ADD CONSTRAINT "TerritoryStatusRecord_legalActId_fkey" FOREIGN KEY ("legalActId") REFERENCES "LegalAct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "SourceVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationIssue" ADD CONSTRAINT "ValidationIssue_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangelogEntry" ADD CONSTRAINT "ChangelogEntry_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "SourceVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangelogEntry" ADD CONSTRAINT "ChangelogEntry_legalActId_fkey" FOREIGN KEY ("legalActId") REFERENCES "LegalAct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportJob" ADD CONSTRAINT "ReportJob_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
