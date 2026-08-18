import type { Metadata } from "next";
import Link from "next/link";
import {
  Alert,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { StatusChip } from "@/components/StatusChip";
import { AsOfDatePicker } from "@/components/AsOfDatePicker";
import { ReportDownloadButton } from "@/components/ReportDownloadButton";
import { CopyConclusionButton } from "@/components/CopyConclusionButton";
import {
  getLatestPublishedUpdateTimestamp,
  getTimelineForUnit,
  getUnitByKatottg,
  resolveStatusForUnit,
} from "@/lib/rules-engine/repository";
import { formatUkrainianDate, formatUkrainianDateTime, toDateInputValue } from "@/lib/format/date";

const TYPE_LABELS: Record<string, string> = {
  AR_CRIMEA: "Автономна Республіка Крим",
  OBLAST: "область",
  RAION: "район",
  HROMADA: "територіальна громада",
  CITY: "місто",
  TOWN: "селище міського типу",
  VILLAGE: "село",
  URBAN_SETTLEMENT: "селище",
  CITY_DISTRICT: "район міста",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ katottg: string }>;
}): Promise<Metadata> {
  const { katottg } = await params;
  const unit = await getUnitByKatottg(katottg);
  return { title: unit ? unit.name : "Об'єкт не знайдено" };
}

export default async function TerritoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ katottg: string }>;
  searchParams: Promise<{ asOf?: string }>;
}) {
  const { katottg } = await params;
  const { asOf } = await searchParams;
  const asOfDate = asOf ? new Date(asOf + "T00:00:00Z") : new Date();

  const unit = await getUnitByKatottg(katottg);

  if (!unit) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">Об’єкт з кодом КАТОТТГ «{katottg}» не знайдено в довіднику.</Alert>
      </Container>
    );
  }

  const [result, timeline, lastUpdated] = await Promise.all([
    resolveStatusForUnit(unit.id, asOfDate),
    getTimelineForUnit(unit.id),
    getLatestPublishedUpdateTimestamp(),
  ]);

  const administrativePath = result.outcome !== "UNIT_NOT_FOUND" ? result.administrativePath : [];

  const shortConclusion =
    result.outcome === "FOUND_STATUS"
      ? `${unit.name} (КАТОТТГ ${unit.katottg}) станом на ${formatUkrainianDate(asOfDate)}: ${result.record.statusCategory.officialLabel}. Підстава: ${result.record.legalAct.title} № ${result.record.legalAct.number}. Інформація сформована автоматично та не є офіційним висновком.`
      : `${unit.name} (КАТОТТГ ${unit.katottg}) станом на ${formatUkrainianDate(asOfDate)}: ${
          result.outcome === "FOUND_NO_RECORD"
            ? "запис у чинному Переліку відсутній"
            : result.outcome === "NEEDS_REVIEW"
              ? "потребує ручної перевірки через суперечливі дані джерела"
              : "немає застосовної редакції джерела на цю дату"
        }. Інформація сформована автоматично та не є офіційним висновком.`;

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Breadcrumbs aria-label="Адміністративний шлях">
          {administrativePath.slice(0, -1).map((p) => (
            <Typography key={p.unit.katottg} color="text.secondary">
              {p.unit.name}
            </Typography>
          ))}
          <Typography color="text.primary">{unit.name}</Typography>
        </Breadcrumbs>

        <Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="h4" component="h1">
              {unit.name}
            </Typography>
            <Chip label={TYPE_LABELS[unit.type] ?? unit.type} />
            {unit.isDemoData && <Chip color="warning" variant="outlined" label="демо-дані" />}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Код КАТОТТГ: {unit.katottg}
          </Typography>
        </Box>

        {unit.isDemoData && (
          <Alert severity="warning">
            Цей об’єкт належить до демонстраційного набору даних. Наведена інформація вигадана й не відображає
            реальний правовий статус жодної реальної території.
          </Alert>
        )}

        <AsOfDatePicker defaultValue={toDateInputValue(asOfDate)} />

        <Card variant="outlined">
          <CardContent>
            {result.outcome === "FOUND_STATUS" && (
              <Stack spacing={1.5}>
                <StatusChip categoryCode={result.record.statusCategory.code} label={result.record.statusCategory.officialLabel} />
                <Typography variant="body1">{result.explanation}</Typography>
                <Divider />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Дата початку статусу
                    </Typography>
                    <Typography variant="body1">{formatUkrainianDate(result.record.startDate)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Дата завершення
                    </Typography>
                    <Typography variant="body1">
                      {result.record.endDate ? formatUkrainianDate(result.record.endDate) : "не визначено"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Рівень нормативного запису
                    </Typography>
                    <Typography variant="body1">
                      {result.appliesVia === "DIRECT" ? "безпосередньо про цей об'єкт" : `успадковано від «${result.recordOwnerUnit.name}»`}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            )}

            {result.outcome === "FOUND_NO_RECORD" && (
              <Alert severity="info">
                <strong>Запис у чинному Переліку відсутній.</strong> {result.explanation}
              </Alert>
            )}

            {result.outcome === "NEEDS_REVIEW" && (
              <Alert severity="warning">
                <strong>Потребує ручної перевірки.</strong> {result.explanation}
              </Alert>
            )}

            {result.outcome === "NO_REDACTION_FOR_DATE" && (
              <Alert severity="info">
                <strong>Немає застосовної редакції на цю дату.</strong> {result.explanation}
              </Alert>
            )}
          </CardContent>
        </Card>

        {result.outcome === "FOUND_STATUS" && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Правова підстава
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  {result.record.legalAct.title} № {result.record.legalAct.number} від{" "}
                  {formatUkrainianDate(result.record.legalAct.adoptedAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Набрання чинності: {formatUkrainianDate(result.record.legalAct.effectiveAt)} · Редакція джерела:{" "}
                  {result.redactionSourceVersion.label}
                </Typography>
                <Typography variant="body2">
                  <a href={result.record.legalAct.officialUrl} target="_blank" rel="noreferrer">
                    Офіційний текст акта
                  </a>
                </Typography>
                {result.record.sourceExcerpt && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                    «{result.record.sourceExcerpt}»
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <ReportDownloadButton katottg={unit.katottg} asOfDate={toDateInputValue(asOfDate)} format="PDF" label="Сформувати звіт (PDF)" />
          <ReportDownloadButton katottg={unit.katottg} asOfDate={toDateInputValue(asOfDate)} format="CSV" label="Завантажити CSV" />
          <CopyConclusionButton text={shortConclusion} />
          <Link href="mailto:support@status-terytorii.invalid?subject=Повідомлення про можливу помилку">
            Повідомити про помилку
          </Link>
        </Stack>

        <Divider />

        <Box>
          <Typography variant="h6" gutterBottom>
            Хронологія змін статусу
          </Typography>
          {timeline.length === 0 ? (
            <Typography color="text.secondary">Записів не знайдено.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Категорія</TableCell>
                  <TableCell>Дата початку</TableCell>
                  <TableCell>Дата завершення</TableCell>
                  <TableCell>Рівень запису</TableCell>
                  <TableCell>Редакція джерела</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeline.map((entry) => (
                  <TableRow key={entry.record.id}>
                    <TableCell>{entry.record.statusCategory.officialLabel}</TableCell>
                    <TableCell>{formatUkrainianDate(entry.record.startDate)}</TableCell>
                    <TableCell>{entry.record.endDate ? formatUkrainianDate(entry.record.endDate) : "не визначено"}</TableCell>
                    <TableCell>{entry.recordOwnerUnit.name}</TableCell>
                    <TableCell>{entry.record.sourceVersion.label}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary">
          Дата й час останнього оновлення бази: {lastUpdated ? formatUkrainianDateTime(lastUpdated) : "невідомо"}.
          Інформація сформована автоматично на підставі зазначених нормативних джерел станом на вказану дату та не
          є офіційним витягом або індивідуальною юридичною консультацією.
        </Typography>
      </Stack>
    </Container>
  );
}
