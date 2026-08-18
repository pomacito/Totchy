import type { Metadata } from "next";
import { Alert, Chip, Container, Stack, Typography } from "@mui/material";
import { prisma } from "@/lib/prisma";
import { formatUkrainianDateTime } from "@/lib/format/date";

export const metadata: Metadata = { title: "Перевірка звіту" };

export default async function VerifyReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const job = await prisma.reportJob.findUnique({ where: { verifyToken: token } });

  return (
    <Container maxWidth="sm">
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Перевірка автентичності звіту
        </Typography>
        {!job ? (
          <Alert severity="error">Звіт із цим кодом перевірки не знайдено.</Alert>
        ) : (
          <>
            <Alert severity="success">
              Цей звіт дійсно сформований системою «Статус території».
            </Alert>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <Typography color="text.secondary">Тип звіту:</Typography>
                <Chip size="small" label={job.type} />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Typography color="text.secondary">Формат:</Typography>
                <Chip size="small" label={job.format} />
              </Stack>
              <Typography color="text.secondary">
                Сформовано: {formatUkrainianDateTime(job.createdAt)}
              </Typography>
              <Typography color="text.secondary">Статус: {job.status}</Typography>
            </Stack>
          </>
        )}
      </Stack>
    </Container>
  );
}
