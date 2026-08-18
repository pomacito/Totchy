import type { Metadata } from "next";
import { Alert, Box, Chip, Container, Divider, Stack, Typography } from "@mui/material";
import { prisma } from "@/lib/prisma";
import { formatUkrainianDate, formatUkrainianDateTime } from "@/lib/format/date";

export const metadata: Metadata = { title: "Журнал оновлень" };

const CHANGE_TYPE_LABELS: Record<string, string> = {
  ADDED: "Додано",
  REMOVED: "Вилучено",
  DATE_CHANGED: "Змінено дату",
  CATEGORY_CHANGED: "Змінено/уточнено категорію",
  RENAMED: "Перейменовано",
  RECODED: "Змінено код",
};

export default async function ChangelogPage() {
  const versions = await prisma.sourceVersion.findMany({
    where: { status: { in: ["PUBLISHED", "ROLLED_BACK"] } },
    include: { legalAct: true, changelog: { orderBy: { createdAt: "asc" } } },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Журнал оновлень
          </Typography>
          <Typography color="text.secondary">
            Публічна хронологія редакцій нормативної бази: що додано, вилучено чи змінено між версіями.
          </Typography>
        </Box>

        {versions.map((v) => (
          <Box key={v.id}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="h6">{v.label}</Typography>
              {v.status === "ROLLED_BACK" && <Chip size="small" color="error" label="відкочено" />}
              {v.isDemoData && <Chip size="small" color="warning" variant="outlined" label="демо-дані" />}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {v.legalAct.title} № {v.legalAct.number} · набрання чинності {formatUkrainianDate(v.legalAct.effectiveAt)} · опубліковано в
              системі {v.publishedAt ? formatUkrainianDateTime(v.publishedAt) : "—"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <a href={v.legalAct.officialUrl} target="_blank" rel="noreferrer">
                Офіційний текст акта
              </a>
            </Typography>

            {v.changelog.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                Для цієї редакції не зафіксовано окремих записів журналу змін.
              </Alert>
            ) : (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {v.changelog.map((entry, i) => (
                  <Box key={i} sx={{ pl: 2, borderLeft: "3px solid", borderColor: "divider" }}>
                    <Chip size="small" label={CHANGE_TYPE_LABELS[entry.changeType] ?? entry.changeType} sx={{ mb: 0.5 }} />
                    <Typography variant="body2">
                      <strong>{entry.territorialUnitRef}</strong> — {entry.description}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
            <Divider sx={{ mt: 3 }} />
          </Box>
        ))}
      </Stack>
    </Container>
  );
}
