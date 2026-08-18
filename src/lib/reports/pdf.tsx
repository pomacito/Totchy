/* eslint-disable react/no-unescaped-entities -- @react-pdf/renderer Text renders to PDF, not HTML; apostrophes are plain text. */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import path from "node:path";
import type { StatusResolutionResult } from "@/lib/rules-engine/types";
import { formatUkrainianDate } from "@/lib/format/date";

// Шрифт зареєстровано через шлях відносно process.cwd() (каталог public/),
// а не __dirname — бандлер Next.js не відстежує й не копіює файли,
// прочитані динамічно через fs у зібраному серверному коді, тому
// __dirname-відносний шлях у production-збірці вказував би в нікуди.
Font.register({
  family: "DejaVuSans",
  fonts: [
    { src: path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "public", "fonts", "DejaVuSans-Bold.ttf"), fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "DejaVuSans", fontSize: 10, color: "#1a1a1a" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#555555", marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginTop: 16, marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 160, color: "#555555" },
  value: { flex: 1 },
  statusBox: { padding: 10, backgroundColor: "#f0f0f0", marginVertical: 10, borderRadius: 4 },
  statusLabel: { fontSize: 13, fontWeight: "bold" },
  disclaimer: {
    marginTop: 24,
    padding: 10,
    fontSize: 8,
    color: "#555555",
    borderTop: "1px solid #cccccc",
  },
  demoBanner: {
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#fde9c8",
    fontSize: 9,
    fontWeight: "bold",
    color: "#7a4b00",
  },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#888888" },
});

const formatDate = formatUkrainianDate;

export type SingleTerritoryReportProps = {
  result: StatusResolutionResult;
  query: string;
  generatedAt: Date;
  verifyUrl: string;
};

export function SingleTerritoryReportDocument({ result, query, generatedAt, verifyUrl }: SingleTerritoryReportProps) {
  const isDemo =
    (result.outcome !== "UNIT_NOT_FOUND" && result.matchedUnit.isDemoData) ||
    (result.outcome === "FOUND_STATUS" && result.redactionSourceVersion.isDemoData) ||
    (result.outcome === "FOUND_NO_RECORD" && result.redactionSourceVersion.isDemoData);

  return (
    <Document title={`Довідка про статус території — ${query}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Довідка про правовий статус території</Text>
        <Text style={styles.subtitle}>
          Сформовано автоматично системою «Статус території» · {formatDate(generatedAt)}
        </Text>

        {isDemo && (
          <Text style={styles.demoBanner}>
            ДЕМОНСТРАЦІЙНІ ДАНІ. Цей звіт сформовано на основі вигаданого навчального набору даних і не
            відображає реальний правовий статус будь-якої території.
          </Text>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Параметр запиту</Text>
          <Text style={styles.value}>{query}</Text>
        </View>

        {result.outcome === "UNIT_NOT_FOUND" && (
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Об'єкт не знайдено</Text>
            <Text>{result.explanation}</Text>
          </View>
        )}

        {result.outcome !== "UNIT_NOT_FOUND" && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Назва об'єкта</Text>
              <Text style={styles.value}>{result.matchedUnit.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Код КАТОТТГ</Text>
              <Text style={styles.value}>{result.matchedUnit.katottg}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Адміністративний шлях</Text>
              <Text style={styles.value}>
                {result.administrativePath.map((p) => p.unit.name).join(" → ")}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Статус станом на</Text>
              <Text style={styles.value}>{formatDate(result.asOfDate)}</Text>
            </View>

            {result.outcome === "FOUND_STATUS" && (
              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>{result.record.statusCategory.officialLabel}</Text>
                <Text style={{ marginTop: 4 }}>{result.explanation}</Text>
                <View style={{ marginTop: 6 }}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Дата початку статусу</Text>
                    <Text style={styles.value}>{formatDate(result.record.startDate)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Дата завершення</Text>
                    <Text style={styles.value}>
                      {result.record.endDate ? formatDate(result.record.endDate) : "не визначено"}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Рівень запису</Text>
                    <Text style={styles.value}>
                      {result.appliesVia === "DIRECT"
                        ? "безпосередньо про цей об'єкт"
                        : `успадковано від «${result.recordOwnerUnit.name}»`}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {result.outcome === "FOUND_NO_RECORD" && (
              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>Запис у Переліку відсутній</Text>
                <Text style={{ marginTop: 4 }}>{result.explanation}</Text>
              </View>
            )}

            {result.outcome === "NEEDS_REVIEW" && (
              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>Потребує ручної перевірки</Text>
                <Text style={{ marginTop: 4 }}>{result.explanation}</Text>
              </View>
            )}

            {result.outcome === "NO_REDACTION_FOR_DATE" && (
              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>Немає застосовної редакції на цю дату</Text>
                <Text style={{ marginTop: 4 }}>{result.explanation}</Text>
              </View>
            )}

            {result.outcome === "FOUND_STATUS" && (
              <>
                <Text style={styles.sectionTitle}>Нормативна підстава</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Акт</Text>
                  <Text style={styles.value}>
                    {result.record.legalAct.title} № {result.record.legalAct.number} від{" "}
                    {formatDate(result.record.legalAct.adoptedAt)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Набрання чинності</Text>
                  <Text style={styles.value}>{formatDate(result.record.legalAct.effectiveAt)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Офіційне посилання</Text>
                  <Text style={styles.value}>{result.record.legalAct.officialUrl}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Редакція джерела</Text>
                  <Text style={styles.value}>{result.redactionSourceVersion.label}</Text>
                </View>
              </>
            )}
          </>
        )}

        <Text style={styles.disclaimer}>
          Інформація сформована автоматично на підставі зазначених нормативних джерел станом на вказану
          дату та не є офіційним витягом або індивідуальною юридичною консультацією. Перевірити автентичність
          цього звіту можна за стабільним посиланням: {verifyUrl}
        </Text>

        <Text style={styles.footer} fixed>
          Статус території · {formatDate(generatedAt)} · {verifyUrl}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderSingleTerritoryPdf(props: SingleTerritoryReportProps): Promise<Buffer> {
  return renderToBuffer(<SingleTerritoryReportDocument {...props} />);
}
