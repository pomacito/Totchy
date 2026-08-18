/**
 * Інтеграційні тести API проти реальної (демонстраційної) бази даних.
 * Потребують запущеного PostgreSQL із застосованими міграціями та
 * виконаним `npm run db:seed` перед запуском.
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as searchRoute } from "@/app/api/search/route";
import { GET as territoryStatusRoute } from "@/app/api/territories/[katottg]/status/route";
import { GET as timelineRoute } from "@/app/api/territories/[katottg]/timeline/route";
import { POST as compareRoute } from "@/app/api/compare/route";

function req(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

describe("GET /api/search", () => {
  it("вимагає вибору для омонімів (два населені пункти «Ясенів»)", async () => {
    const res = await searchRoute(req("http://localhost:3000/api/search?q=Ясенів"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.requiresDisambiguation).toBe(true);
    expect(body.results.length).toBeGreaterThanOrEqual(2);
  });

  it("знаходить об'єкт з типовою одруківкою (нечіткий пошук)", async () => {
    const res = await searchRoute(req("http://localhost:3000/api/search?q=Вербовка"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.results.some((r: { name: string }) => r.name === "Вербівка")).toBe(true);
  });

  it("повертає 400 на порожній запит", async () => {
    const res = await searchRoute(req("http://localhost:3000/api/search?q="));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/territories/[katottg]/status", () => {
  it("повертає DIRECT-статус міста в межах дії точкового запису", async () => {
    const res = await territoryStatusRoute(
      req("http://localhost:3000/api/territories/DEMO-01-01-01-CTY1/status?asOf=2024-03-01"),
      { params: { katottg: "DEMO-01-01-01-CTY1" } }
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.outcome).toBe("FOUND_STATUS");
    expect(body.status.appliesVia).toBe("DIRECT");
    expect(body.status.categoryCode).toBe("ACTIVE_HOSTILITIES_STATE_RESOURCES");
    expect(body.confidence).toBe("demo_data");
  });

  it("повертає NEEDS_REVIEW для конфліктної громади", async () => {
    const res = await territoryStatusRoute(
      req("http://localhost:3000/api/territories/DEMO-01-01-02-VLG1/status?asOf=2024-08-01"),
      { params: { katottg: "DEMO-01-01-02-VLG1" } }
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.outcome).toBe("NEEDS_REVIEW");
  });

  it("повертає 404 з кодом UNIT_NOT_FOUND для невідомого коду", async () => {
    const res = await territoryStatusRoute(
      req("http://localhost:3000/api/territories/DEMO-99-99-99-XXX/status"),
      { params: { katottg: "DEMO-99-99-99-XXX" } }
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("UNIT_NOT_FOUND");
  });

  it("розрізняє редакції у часі: запис, доданий лише у SV2, відсутній до 2024-07-10", async () => {
    const before = await territoryStatusRoute(
      req("http://localhost:3000/api/territories/DEMO-02-01-01-VLG1/status?asOf=2024-05-01"),
      { params: { katottg: "DEMO-02-01-01-VLG1" } }
    );
    const beforeBody = await before.json();
    expect(beforeBody.outcome).toBe("FOUND_NO_RECORD");

    const after = await territoryStatusRoute(
      req("http://localhost:3000/api/territories/DEMO-02-01-01-VLG1/status?asOf=2024-08-01"),
      { params: { katottg: "DEMO-02-01-01-VLG1" } }
    );
    const afterBody = await after.json();
    expect(afterBody.outcome).toBe("FOUND_STATUS");
    expect(afterBody.status.categoryCode).toBe("ACTIVE_HOSTILITIES");
  });
});

describe("GET /api/territories/[katottg]/timeline", () => {
  it("повертає хронологію, відсортовану від найновіших", async () => {
    const res = await timelineRoute(req("http://localhost:3000/api/territories/DEMO-01-01-01-HRM/timeline"), {
      params: { katottg: "DEMO-01-01-01-HRM" },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.timeline.length).toBeGreaterThan(0);
    const dates = body.timeline.map((t: { startDate: string }) => new Date(t.startDate).getTime());
    expect([...dates]).toEqual([...dates].sort((a, b) => b - a));
  });
});

describe("POST /api/compare", () => {
  it("порівнює кілька об'єктів і повертає результат для кожного", async () => {
    const res = await compareRoute(
      req("http://localhost:3000/api/compare", {
        method: "POST",
        body: JSON.stringify({
          katottgCodes: ["DEMO-01-01-01-CTY1", "DEMO-01-01-01-VLG1"],
          asOfDate: "2024-08-01",
        }),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(2);
  });

  it("повертає 400, якщо передано менше двох об'єктів", async () => {
    const res = await compareRoute(
      req("http://localhost:3000/api/compare", {
        method: "POST",
        body: JSON.stringify({ katottgCodes: ["DEMO-01-01-01-CTY1"] }),
      })
    );
    expect(res.status).toBe(400);
  });
});
