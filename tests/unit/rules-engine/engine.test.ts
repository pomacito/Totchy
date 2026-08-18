import { describe, expect, it } from "vitest";
import { resolveStatus } from "@/lib/rules-engine/engine";
import {
  citySettlement,
  cityRecordSv1,
  conflictHromada,
  conflictRecordA,
  conflictRecordB,
  hromada,
  hromadaRecordSv1,
  hromadaRecordSv2,
  oblast,
  raion,
  sv1,
  sv2,
  villageSettlement,
} from "./fixtures";

describe("resolveStatus: базові випадки визначення об'єкта", () => {
  it("повертає UNIT_NOT_FOUND, якщо об'єкт не ідентифіковано", () => {
    const result = resolveStatus({
      targetUnit: null,
      ancestors: [],
      candidateSourceVersions: [],
      records: [],
      asOfDate: new Date("2024-08-01T00:00:00Z"),
    });
    expect(result.outcome).toBe("UNIT_NOT_FOUND");
  });

  it("повертає NO_REDACTION_FOR_DATE, якщо дата раніша за набуття чинності будь-якою редакцією", () => {
    const result = resolveStatus({
      targetUnit: villageSettlement,
      ancestors: [hromada, raion, oblast],
      candidateSourceVersions: [sv1],
      records: [hromadaRecordSv1],
      asOfDate: new Date("2023-01-01T00:00:00Z"),
    });
    expect(result.outcome).toBe("NO_REDACTION_FOR_DATE");
  });

});

describe("resolveStatus: успадкування та пріоритет рівня запису", () => {
  it("село без власного запису успадковує статус громади (INHERITED)", () => {
    const result = resolveStatus({
      targetUnit: villageSettlement,
      ancestors: [hromada, raion, oblast],
      candidateSourceVersions: [sv1],
      records: [hromadaRecordSv1],
      asOfDate: new Date("2024-01-20T00:00:00Z"),
    });
    expect(result.outcome).toBe("FOUND_STATUS");
    if (result.outcome === "FOUND_STATUS") {
      expect(result.appliesVia).toBe("INHERITED");
      expect(result.record.statusCategory.code).toBe("TEMPORARILY_OCCUPIED");
      expect(result.recordOwnerUnit.id).toBe(hromada.id);
    }
  });

  it("місто з власним точковим записом отримує DIRECT-статус, що перекриває успадкований від громади", () => {
    const result = resolveStatus({
      targetUnit: citySettlement,
      ancestors: [hromada, raion, oblast],
      candidateSourceVersions: [sv1],
      records: [hromadaRecordSv1, cityRecordSv1],
      asOfDate: new Date("2024-03-01T00:00:00Z"),
    });
    expect(result.outcome).toBe("FOUND_STATUS");
    if (result.outcome === "FOUND_STATUS") {
      expect(result.appliesVia).toBe("DIRECT");
      expect(result.record.statusCategory.code).toBe("ACTIVE_HOSTILITIES_STATE_RESOURCES");
    }
  });

  it("після завершення дії точкового запису місто знову успадковує статус громади", () => {
    const result = resolveStatus({
      targetUnit: citySettlement,
      ancestors: [hromada, raion, oblast],
      candidateSourceVersions: [sv1],
      records: [hromadaRecordSv1, cityRecordSv1],
      asOfDate: new Date("2024-05-01T00:00:00Z"), // після endDate точкового запису (2024-04-01), ще в межах дії SV1
    });
    expect(result.outcome).toBe("FOUND_STATUS");
    if (result.outcome === "FOUND_STATUS") {
      expect(result.appliesVia).toBe("INHERITED");
      expect(result.record.statusCategory.code).toBe("TEMPORARILY_OCCUPIED");
    }
  });

  it("до початку дії точкового запису місто має статус громади, а не власний", () => {
    const result = resolveStatus({
      targetUnit: citySettlement,
      ancestors: [hromada, raion, oblast],
      candidateSourceVersions: [sv1],
      records: [hromadaRecordSv1, cityRecordSv1],
      asOfDate: new Date("2024-01-20T00:00:00Z"), // після effectiveAt SV1, але до початку точкового запису (2024-02-01)
    });
    expect(result.outcome).toBe("FOUND_STATUS");
    if (result.outcome === "FOUND_STATUS") {
      expect(result.appliesVia).toBe("INHERITED");
    }
  });
});

describe("resolveStatus: версіювання та редакції у часі", () => {
  it("запис, доданий лише у SV2, не застосовується до дат, коли чинною була SV1", () => {
    const result = resolveStatus({
      targetUnit: villageSettlement,
      ancestors: [hromada, raion, oblast],
      candidateSourceVersions: [sv1], // SV2 навмисно не передана як кандидат
      records: [hromadaRecordSv1],
      asOfDate: new Date("2024-05-01T00:00:00Z"),
    });
    expect(result.outcome).toBe("FOUND_STATUS");
    if (result.outcome === "FOUND_STATUS") {
      expect(result.redactionSourceVersion.id).toBe(sv1.id);
    }
  });

  it("на дату, коли чинна SV2, обирається саме ця редакція, а не SV1", () => {
    const result = resolveStatus({
      targetUnit: villageSettlement,
      ancestors: [hromada, raion, oblast],
      candidateSourceVersions: [sv1, sv2],
      records: [hromadaRecordSv1, hromadaRecordSv2],
      asOfDate: new Date("2024-08-01T00:00:00Z"),
    });
    expect(result.outcome).toBe("FOUND_STATUS");
    if (result.outcome === "FOUND_STATUS") {
      expect(result.redactionSourceVersion.id).toBe(sv2.id);
      expect(result.record.sourceVersion.id).toBe(sv2.id);
    }
  });
});

describe("resolveStatus: конфлікти та відсутність записів", () => {
  it("повертає NEEDS_REVIEW, якщо на одному рівні одночасно чинні записи різних категорій", () => {
    const result = resolveStatus({
      targetUnit: conflictHromada,
      ancestors: [raion, oblast],
      candidateSourceVersions: [sv2],
      records: [conflictRecordA, conflictRecordB],
      asOfDate: new Date("2024-08-01T00:00:00Z"),
    });
    expect(result.outcome).toBe("NEEDS_REVIEW");
    if (result.outcome === "NEEDS_REVIEW") {
      expect(result.conflictingRecords).toHaveLength(2);
    }
  });

  it("повертає FOUND_NO_RECORD для об'єкта без жодного застосовного запису у чинній редакції", () => {
    const result = resolveStatus({
      targetUnit: oblast,
      ancestors: [],
      candidateSourceVersions: [sv1],
      records: [], // жоден запис не стосується самої області
      asOfDate: new Date("2024-02-01T00:00:00Z"),
    });
    expect(result.outcome).toBe("FOUND_NO_RECORD");
  });

  it("ігнорує записи, що не належать цільовому об'єкту чи його предкам, навіть якщо викликач їх передав", () => {
    const result = resolveStatus({
      targetUnit: oblast,
      ancestors: [],
      candidateSourceVersions: [sv1],
      records: [hromadaRecordSv1], // належить іншій одиниці (громаді), не області чи її предку
      asOfDate: new Date("2024-02-01T00:00:00Z"),
    });
    expect(result.outcome).toBe("FOUND_NO_RECORD");
  });
});
