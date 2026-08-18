/**
 * ДЕМОНСТРАЦІЙНИЙ насіннєвий набір даних.
 *
 * Через відсутність доступу до офіційних джерел (мережева політика цього
 * середовища розробки блокує zakon.rada.gov.ua, data.gov.ua та інші урядові
 * домени) увесь набір нижче — ВИГАДАНИЙ. Області, райони, громади,
 * населені пункти, коди КАТОТТГ, номери й дати нормативних актів та URL
 * НЕ відповідають жодним реальним об'єктам чи документам. Це навмисно:
 * реальні географічні назви навмисно не використовуються, щоб демо-дані
 * фізично не могли бути сплутані з реальним статусом реальних територій.
 *
 * Кожен запис позначено isDemoData=true. Перед виробничим використанням
 * цей набір має бути повністю замінений реальним імпортом (див.
 * docs/IMPORT_GUIDE.md) — production-режим не повинен містити цих даних.
 */
import { PrismaClient, type TerritorialUnitType, type RecordLevel } from "@prisma/client";
import { hashPassword } from "../../src/lib/auth/password";
import { normalizeName } from "../../src/lib/search/normalize";

const prisma = new PrismaClient();

async function main() {
  console.log("Очищення попередніх демонстраційних даних...");
  await prisma.auditLog.deleteMany({});
  await prisma.reportJob.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.validationIssue.deleteMany({});
  await prisma.changelogEntry.deleteMany({});
  await prisma.territoryStatusRecord.deleteMany({});
  await prisma.importJob.deleteMany({});
  await prisma.settlementName.deleteMany({});
  await prisma.territorialUnit.deleteMany({});
  await prisma.sourceVersion.deleteMany({});
  await prisma.legalAct.deleteMany({});
  await prisma.statusCategory.deleteMany({});
  await prisma.user.deleteMany({});

  // --- Користувачі (демо-облікові записи для адмін-панелі) -----------------
  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.status-terytorii.invalid",
      displayName: "Демо-адміністратор",
      role: "ADMIN",
      passwordHash: hashPassword("DemoAdmin#2026"),
    },
  });
  await prisma.user.create({
    data: {
      email: "verifier@demo.status-terytorii.invalid",
      displayName: "Демо-верифікатор",
      role: "LEGAL_VERIFIER",
      passwordHash: hashPassword("DemoVerifier#2026"),
    },
  });
  await prisma.user.create({
    data: {
      email: "editor@demo.status-terytorii.invalid",
      displayName: "Демо-редактор",
      role: "EDITOR",
      passwordHash: hashPassword("DemoEditor#2026"),
    },
  });

  // --- Категорії статусу (офіційні формулювання з ТЗ, п.1) -----------------
  const [catPossible, catActive, catActiveEres, catOccupied] = await Promise.all([
    prisma.statusCategory.create({
      data: {
        code: "POSSIBLE_HOSTILITIES",
        officialLabel: "територія можливих бойових дій",
        shortLabel: "Можливі бойові дії",
        description:
          "Територія, де можливе ведення бойових дій, але наразі вони не ведуться активно.",
        priority: 1,
        colorToken: "status-possible",
      },
    }),
    prisma.statusCategory.create({
      data: {
        code: "ACTIVE_HOSTILITIES",
        officialLabel: "територія активних бойових дій",
        shortLabel: "Активні бойові дії",
        description: "Територія, на якій наразі ведуться активні бойові дії.",
        priority: 2,
        colorToken: "status-active",
      },
    }),
    prisma.statusCategory.create({
      data: {
        code: "ACTIVE_HOSTILITIES_STATE_RESOURCES",
        officialLabel:
          "територія активних бойових дій, на якій функціонують державні електронні інформаційні ресурси",
        shortLabel: "Активні бойові дії (держ. е-ресурси діють)",
        description:
          "Територія активних бойових дій, де, попри це, продовжують функціонувати державні електронні інформаційні ресурси.",
        priority: 3,
        colorToken: "status-active-eresources",
      },
    }),
    prisma.statusCategory.create({
      data: {
        code: "TEMPORARILY_OCCUPIED",
        officialLabel: "тимчасово окупована територія",
        shortLabel: "Тимчасово окупована",
        description: "Територія, тимчасово окупована Російською Федерацією.",
        priority: 4,
        colorToken: "status-occupied",
      },
    }),
  ]);

  // --- Нормативні акти (ВИГАДАНІ, демонстраційні) ---------------------------
  const actV1 = await prisma.legalAct.create({
    data: {
      type: "ORDER",
      issuingBody: "Демонстраційне відомство (навчальний приклад, не існує)",
      number: "ДЕМО-100",
      title:
        "Про затвердження Переліку територій (демонстраційна редакція №1, вигадана для тестування системи)",
      adoptedAt: new Date("2024-01-10T00:00:00Z"),
      effectiveAt: new Date("2024-01-15T00:00:00Z"),
      officialUrl: "https://example.invalid/demo-perelik/act-100",
      documentSha256: "0".repeat(64),
      status: "SUPERSEDED",
    },
  });

  const actV2 = await prisma.legalAct.create({
    data: {
      type: "ORDER",
      issuingBody: "Демонстраційне відомство (навчальний приклад, не існує)",
      number: "ДЕМО-205",
      title:
        "Про затвердження Переліку територій (демонстраційна редакція №2, вигадана для тестування системи)",
      adoptedAt: new Date("2024-07-01T00:00:00Z"),
      effectiveAt: new Date("2024-07-10T00:00:00Z"),
      officialUrl: "https://example.invalid/demo-perelik/act-205",
      documentSha256: "1".repeat(64),
      status: "ACTIVE",
    },
  });

  const sv1 = await prisma.sourceVersion.create({
    data: {
      label: "Демо-редакція 2024-01-15",
      legalActId: actV1.id,
      retrievedAt: new Date("2024-01-16T09:00:00Z"),
      status: "PUBLISHED",
      publishedAt: new Date("2024-01-17T10:00:00Z"),
      isDemoData: true,
      notes: "Вигадана редакція №1 для демонстрації роботи системи.",
    },
  });

  const sv2 = await prisma.sourceVersion.create({
    data: {
      label: "Демо-редакція 2024-07-10",
      legalActId: actV2.id,
      retrievedAt: new Date("2024-07-11T09:00:00Z"),
      status: "PUBLISHED",
      publishedAt: new Date("2024-07-12T10:00:00Z"),
      supersedesId: sv1.id,
      isDemoData: true,
      notes: "Вигадана редакція №2 для демонстрації версіювання та журналу змін.",
    },
  });

  // --- Довідник адміністративно-територіальних одиниць (вигаданий) --------
  type UnitSeed = {
    key: string;
    katottg: string;
    name: string;
    type: TerritorialUnitType;
    parentKey: string | null;
    former?: { name: string; validTo: string };
    alternative?: string;
  };

  const units: UnitSeed[] = [
    { key: "obl1", katottg: "DEMO-01-00-00-OBL", name: "Затіссянська область", type: "OBLAST", parentKey: null },
    { key: "rai1", katottg: "DEMO-01-01-00-RAI", name: "Прикордонний район", type: "RAION", parentKey: "obl1" },
    { key: "hrm1", katottg: "DEMO-01-01-01-HRM", name: "Вербівська громада", type: "HROMADA", parentKey: "rai1" },
    {
      key: "st_verbivka",
      katottg: "DEMO-01-01-01-CTY1",
      name: "Вербівка",
      type: "CITY",
      parentKey: "hrm1",
    },
    {
      key: "st_zatyshne",
      katottg: "DEMO-01-01-01-VLG1",
      name: "Затишне",
      type: "VILLAGE",
      parentKey: "hrm1",
    },
    { key: "rai2", katottg: "DEMO-01-02-00-RAI", name: "Прирічковий район", type: "RAION", parentKey: "obl1" },
    { key: "hrm2", katottg: "DEMO-01-02-01-HRM", name: "Ясенівська громада", type: "HROMADA", parentKey: "rai2" },
    {
      key: "st_yaseniv_a",
      katottg: "DEMO-01-02-01-TWN1",
      name: "Ясенів",
      type: "TOWN",
      parentKey: "hrm2",
    },
    {
      key: "st_pryrichkove",
      katottg: "DEMO-01-02-01-URB1",
      name: "Прирічкове",
      type: "URBAN_SETTLEMENT",
      parentKey: "hrm2",
      former: { name: "Заводське (колишня назва)", validTo: "2016-01-01" },
      alternative: "Прирічне",
    },
    {
      key: "hrm_conflict",
      katottg: "DEMO-01-01-02-HRM",
      name: "Конфліктна громада",
      type: "HROMADA",
      parentKey: "rai1",
    },
    {
      key: "st_prykladove",
      katottg: "DEMO-01-01-02-VLG1",
      name: "Прикладове",
      type: "VILLAGE",
      parentKey: "hrm_conflict",
    },
    { key: "obl2", katottg: "DEMO-02-00-00-OBL", name: "Степова область", type: "OBLAST", parentKey: null },
    { key: "rai3", katottg: "DEMO-02-01-00-RAI", name: "Верхній район", type: "RAION", parentKey: "obl2" },
    { key: "hrm3", katottg: "DEMO-02-01-01-HRM", name: "Гірська громада", type: "HROMADA", parentKey: "rai3" },
    {
      key: "st_yaseniv_b",
      katottg: "DEMO-02-01-01-VLG1",
      name: "Ясенів",
      type: "VILLAGE",
      parentKey: "hrm3",
    },
    {
      key: "arc",
      katottg: "DEMO-03-00-00-ARC",
      name: "Демо-Крим (умовна назва)",
      type: "AR_CRIMEA",
      parentKey: null,
    },
    { key: "rai4", katottg: "DEMO-03-01-00-RAI", name: "Приморський район (демо)", type: "RAION", parentKey: "arc" },
    { key: "hrm4", katottg: "DEMO-03-01-01-HRM", name: "Скельна громада", type: "HROMADA", parentKey: "rai4" },
    {
      key: "st_skelyasta",
      katottg: "DEMO-03-01-01-TWN1",
      name: "Скеляста",
      type: "TOWN",
      parentKey: "hrm4",
    },
  ];

  const idByKey = new Map<string, string>();
  for (const u of units) {
    const parentId = u.parentKey ? idByKey.get(u.parentKey) ?? null : null;
    const created = await prisma.territorialUnit.create({
      data: {
        katottg: u.katottg,
        name: u.name,
        type: u.type,
        parentId,
        validFrom: new Date("2020-01-01T00:00:00Z"),
        validTo: null,
        isDemoData: true,
      },
    });
    idByKey.set(u.key, created.id);

    await prisma.settlementName.create({
      data: {
        territorialUnitId: created.id,
        name: u.name,
        nameNormalized: normalizeName(u.name),
        type: "OFFICIAL",
        validFrom: new Date("2020-01-01T00:00:00Z"),
        validTo: null,
      },
    });

    if (u.former) {
      await prisma.settlementName.create({
        data: {
          territorialUnitId: created.id,
          name: u.former.name,
          nameNormalized: normalizeName(u.former.name),
          type: "FORMER",
          validFrom: null,
          validTo: new Date(u.former.validTo),
        },
      });
    }
    if (u.alternative) {
      await prisma.settlementName.create({
        data: {
          territorialUnitId: created.id,
          name: u.alternative,
          nameNormalized: normalizeName(u.alternative),
          type: "ALTERNATIVE",
          validFrom: null,
          validTo: null,
        },
      });
    }
  }

  // --- Записи статусу --------------------------------------------------------
  type RecordSeed = {
    unitKey: string;
    categoryId: string;
    level: RecordLevel;
    start: string;
    end: string | null;
    sourceVersionId: string;
    legalActId: string;
    excerpt: string;
    rowRef: string;
    needsReview?: boolean;
    reviewReason?: string;
  };

  const recordSeeds: RecordSeed[] = [
    // Вербівська громада: базовий статус — тимчасово окупована, чинний в обох редакціях.
    {
      unitKey: "hrm1",
      categoryId: catOccupied.id,
      level: "HROMADA",
      start: "2022-03-15",
      end: null,
      sourceVersionId: sv1.id,
      legalActId: actV1.id,
      excerpt: "Вербівська територіальна громада — тимчасово окупована територія.",
      rowRef: "Демо-додаток 1, розділ IV, п. 12",
    },
    {
      unitKey: "hrm1",
      categoryId: catOccupied.id,
      level: "HROMADA",
      start: "2022-03-15",
      end: null,
      sourceVersionId: sv2.id,
      legalActId: actV2.id,
      excerpt: "Вербівська територіальна громада — тимчасово окупована територія.",
      rowRef: "Демо-додаток 1, розділ IV, п. 12",
    },
    // Вербівка (місто): протягом обмеженого періоду (у межах дії SV1) мала
    // власний, конкретніший статус, ніж громада.
    {
      unitKey: "st_verbivka",
      categoryId: catActiveEres.id,
      level: "SETTLEMENT",
      start: "2024-02-01",
      end: "2024-04-01",
      sourceVersionId: sv1.id,
      legalActId: actV1.id,
      excerpt:
        "м. Вербівка — територія активних бойових дій, на якій функціонують державні електронні інформаційні ресурси.",
      rowRef: "Демо-додаток 1, розділ II, п. 3",
    },
    // Ясенівська громада (омонім A, Затіссянська область): можливі бойові дії з 2024-02-01.
    {
      unitKey: "hrm2",
      categoryId: catPossible.id,
      level: "HROMADA",
      start: "2024-02-01",
      end: null,
      sourceVersionId: sv1.id,
      legalActId: actV1.id,
      excerpt: "Ясенівська територіальна громада — територія можливих бойових дій.",
      rowRef: "Демо-додаток 1, розділ I, п. 7",
    },
    {
      unitKey: "hrm2",
      categoryId: catPossible.id,
      level: "HROMADA",
      start: "2024-02-01",
      end: null,
      sourceVersionId: sv2.id,
      legalActId: actV2.id,
      excerpt: "Ясенівська територіальна громада — територія можливих бойових дій.",
      rowRef: "Демо-додаток 1, розділ I, п. 7",
    },
    // Ясенів (омонім B, Степова область, с. Ясенів): запису не було в SV1, додано лише в SV2.
    {
      unitKey: "st_yaseniv_b",
      categoryId: catActive.id,
      level: "SETTLEMENT",
      start: "2024-06-20",
      end: null,
      sourceVersionId: sv2.id,
      legalActId: actV2.id,
      excerpt: "с. Ясенів (Гірська громада) — територія активних бойових дій.",
      rowRef: "Демо-додаток 1, розділ III, п. 9",
    },
    // Скеляста (АРК, демо): довготривалий статус з давньою датою початку.
    {
      unitKey: "st_skelyasta",
      categoryId: catOccupied.id,
      level: "SETTLEMENT",
      start: "2014-03-20",
      end: null,
      sourceVersionId: sv1.id,
      legalActId: actV1.id,
      excerpt: "м. Скеляста — тимчасово окупована територія.",
      rowRef: "Демо-додаток 2, розділ I, п. 1",
    },
    {
      unitKey: "st_skelyasta",
      categoryId: catOccupied.id,
      level: "SETTLEMENT",
      start: "2014-03-20",
      end: null,
      sourceVersionId: sv2.id,
      legalActId: actV2.id,
      excerpt: "м. Скеляста — тимчасово окупована територія.",
      rowRef: "Демо-додаток 2, розділ I, п. 1",
    },
    // Конфліктна громада: два одночасно чинні записи з різними категоріями -> NEEDS_REVIEW.
    {
      unitKey: "hrm_conflict",
      categoryId: catActive.id,
      level: "HROMADA",
      start: "2024-03-01",
      end: null,
      sourceVersionId: sv2.id,
      legalActId: actV2.id,
      excerpt: "Конфліктна громада — територія активних бойових дій (джерело рядок А).",
      rowRef: "Демо-додаток 1, розділ V, п. 21а",
      needsReview: true,
      reviewReason:
        "Виявлено суперечність: та сама одиниця одночасно вказана у двох розділах документа з різними категоріями.",
    },
    {
      unitKey: "hrm_conflict",
      categoryId: catPossible.id,
      level: "HROMADA",
      start: "2024-03-01",
      end: null,
      sourceVersionId: sv2.id,
      legalActId: actV2.id,
      excerpt: "Конфліктна громада — територія можливих бойових дій (джерело рядок Б).",
      rowRef: "Демо-додаток 1, розділ V, п. 21б",
      needsReview: true,
      reviewReason:
        "Виявлено суперечність: та сама одиниця одночасно вказана у двох розділах документа з різними категоріями.",
    },
  ];

  for (const r of recordSeeds) {
    await prisma.territoryStatusRecord.create({
      data: {
        territorialUnitId: idByKey.get(r.unitKey)!,
        statusCategoryId: r.categoryId,
        recordLevel: r.level,
        startDate: new Date(r.start + "T00:00:00Z"),
        endDate: r.end ? new Date(r.end + "T00:00:00Z") : null,
        sourceVersionId: r.sourceVersionId,
        legalActId: r.legalActId,
        sourceExcerpt: r.excerpt,
        sourceRowRef: r.rowRef,
        needsReview: r.needsReview ?? false,
        reviewReason: r.reviewReason,
      },
    });
  }

  // --- Import jobs -----------------------------------------------------------
  const job1 = await prisma.importJob.create({
    data: {
      sourceVersionId: sv1.id,
      status: "PUBLISHED",
      startedAt: new Date("2024-01-16T09:00:00Z"),
      finishedAt: new Date("2024-01-17T10:00:00Z"),
      triggeredBy: admin.id,
      log: "Демонстраційний імпорт редакції №1 успішно опубліковано.",
      recordsTotal: 5,
      recordsChanged: 5,
      recordsFlagged: 0,
    },
  });
  const job2 = await prisma.importJob.create({
    data: {
      sourceVersionId: sv2.id,
      status: "PUBLISHED",
      startedAt: new Date("2024-07-11T09:00:00Z"),
      finishedAt: new Date("2024-07-12T10:00:00Z"),
      triggeredBy: admin.id,
      log: "Демонстраційний імпорт редакції №2 опубліковано після ручної перевірки конфлікту у «Конфліктній громаді».",
      recordsTotal: 6,
      recordsChanged: 3,
      recordsFlagged: 2,
    },
  });

  await prisma.validationIssue.create({
    data: {
      importJobId: job2.id,
      severity: "CRITICAL",
      code: "CONFLICTING_OVERLAPPING_CATEGORY",
      message:
        "Для «Конфліктної громади» знайдено два одночасно чинні записи з різними категоріями статусу.",
      entityRef: idByKey.get("hrm_conflict"),
      resolved: false,
    },
  });
  await prisma.validationIssue.create({
    data: {
      importJobId: job2.id,
      severity: "WARNING",
      code: "SETTLEMENT_RECORD_EXPIRED_WITHOUT_REPLACEMENT",
      message:
        "Точковий запис для м. Вербівка завершився 2024-04-01 без явної заміни; статус успадковується від громади.",
      entityRef: idByKey.get("st_verbivka"),
      resolved: true,
      resolvedBy: admin.id,
      resolvedAt: new Date("2024-07-12T09:30:00Z"),
    },
  });

  // --- Журнал змін (diff SV1 -> SV2) -----------------------------------------
  await prisma.changelogEntry.create({
    data: {
      sourceVersionId: sv2.id,
      legalActId: actV2.id,
      changeType: "ADDED",
      territorialUnitRef: "DEMO-02-01-01-VLG1 (с. Ясенів, Гірська громада)",
      description:
        "Додано новий запис: с. Ясенів (Гірська громада, Степова область) віднесено до категорії «територія активних бойових дій» з 2024-06-20.",
    },
  });
  await prisma.changelogEntry.create({
    data: {
      sourceVersionId: sv2.id,
      legalActId: actV2.id,
      changeType: "REMOVED",
      territorialUnitRef: "DEMO-01-01-01-CTY1 (м. Вербівка)",
      description:
        "Точковий запис для м. Вербівка (категорія «активні бойові дії, держ. е-ресурси діють») не подовжено після 2024-04-01; статус міста тепер визначається успадкуванням від громади.",
    },
  });
  await prisma.changelogEntry.create({
    data: {
      sourceVersionId: sv2.id,
      legalActId: actV2.id,
      changeType: "CATEGORY_CHANGED",
      territorialUnitRef: "DEMO-01-01-02-HRM (Конфліктна громада)",
      description:
        "Виявлено суперечливе одночасне віднесення «Конфліктної громади» до двох різних категорій — запис потребує ручної перевірки перед остаточним визначенням.",
    },
  });

  // --- Аудит-журнал -----------------------------------------------------------
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "IMPORT_PUBLISH",
      entityType: "SourceVersion",
      entityId: sv1.id,
      afterJson: JSON.stringify({ status: "PUBLISHED" }),
      comment: "Публікація демонстраційної редакції №1.",
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "IMPORT_PUBLISH",
      entityType: "SourceVersion",
      entityId: sv2.id,
      afterJson: JSON.stringify({ status: "PUBLISHED" }),
      comment:
        "Публікація демонстраційної редакції №2 із залишеним відкритим конфліктом у «Конфліктній громаді» (потребує подальшої перевірки).",
    },
  });

  console.log("Демонстраційний набір даних успішно завантажено.");
  console.log("Демо-облікові записи адмін-панелі:");
  console.log("  admin@demo.status-terytorii.invalid / DemoAdmin#2026 (ADMIN)");
  console.log("  verifier@demo.status-terytorii.invalid / DemoVerifier#2026 (LEGAL_VERIFIER)");
  console.log("  editor@demo.status-terytorii.invalid / DemoEditor#2026 (EDITOR)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
