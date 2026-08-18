import type { Metadata } from "next";
import { Alert, Box, Card, CardContent, Container, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { computeAnalyticsSummary } from "@/lib/analytics/summary";
import { formatUkrainianDate } from "@/lib/format/date";

export const metadata: Metadata = { title: "Аналітична панель" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string }>;
}) {
  const { asOf } = await searchParams;
  const asOfDate = asOf ? new Date(asOf + "T00:00:00Z") : new Date();
  const summary = await computeAnalyticsSummary(asOfDate);
  const maxCategoryCount = Math.max(1, ...summary.byCategory.map((c) => c.count));

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Аналітична панель
          </Typography>
          <Typography color="text.secondary">
            Дані станом на {formatUkrainianDate(asOfDate)}. Розраховано автоматично із застосуванням rules engine
            до кожної звітної одиниці — методику обчислення описано на сторінці «Методологія».
          </Typography>
        </Box>

        <Alert severity="warning" variant="outlined">
          Демонстраційний набір даних: показники нижче не відображають реальну статистику будь-яких територій
          України.
        </Alert>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
          <SummaryTile label="Розглянуто одиниць" value={summary.totalUnitsConsidered} />
          <SummaryTile label="Потребують перевірки" value={summary.needsReviewCount} tone="warning" />
          <SummaryTile label="Без запису в Переліку" value={summary.noRecordCount} />
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Розподіл за категоріями статусу
            </Typography>
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              {summary.byCategory.map((c) => (
                <Box key={c.categoryCode}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">{c.label}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {c.count}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(c.count / maxCategoryCount) * 100}
                    aria-label={`${c.label}: ${c.count}`}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Текстовий еквівалент: {summary.byCategory.map((c) => `${c.label} — ${c.count}`).join("; ") || "немає даних"}.
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Розподіл за областями/АРК
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Область / АРК</TableCell>
                  <TableCell align="right">Усього</TableCell>
                  <TableCell>За категоріями</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.byOblast.map((o) => (
                  <TableRow key={o.oblastName}>
                    <TableCell>{o.oblastName}</TableCell>
                    <TableCell align="right">{o.total}</TableCell>
                    <TableCell>
                      {Object.entries(o.byCategory)
                        .map(([code, count]) => `${code}: ${count}`)
                        .join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
          <SummaryTile label="Мають дату завершення" value={summary.withEndDate} />
          <SummaryTile label="Без дати завершення" value={summary.withoutEndDate} />
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Якість даних
            </Typography>
            <Typography variant="body2">
              Відкриті зауваження перевірки: {summary.dataQuality.validationIssuesOpen}. Вирішені: {summary.dataQuality.validationIssuesResolved}.
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Останні нормативні оновлення
            </Typography>
            {summary.recentChangelogEntries.length === 0 ? (
              <Typography color="text.secondary">Немає записів.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Тип зміни</TableCell>
                    <TableCell>Опис</TableCell>
                    <TableCell>Дата</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.recentChangelogEntries.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell>{e.changeType}</TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell>{formatUkrainianDate(new Date(e.createdAt))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary">
          Дані можна експортувати у форматі CSV на сторінці окремого об’єкта або через публічне API
          (GET /api/analytics/summary).
        </Typography>
      </Stack>
    </Container>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" color={tone === "warning" ? "warning.main" : undefined}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
