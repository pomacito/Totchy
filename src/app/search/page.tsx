import Link from "next/link";
import type { Metadata } from "next";
import { Alert, Box, Card, CardActionArea, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import { SearchBox } from "@/components/SearchBox";
import { groupsRequiringDisambiguation, searchCombined } from "@/lib/search/repository";

export const metadata: Metadata = { title: "Результати пошуку" };

const TYPE_LABELS: Record<string, string> = {
  AR_CRIMEA: "Автономна Республіка Крим",
  OBLAST: "область",
  RAION: "район",
  HROMADA: "громада",
  CITY: "місто",
  TOWN: "селище міського типу",
  VILLAGE: "село",
  URBAN_SETTLEMENT: "селище",
  CITY_DISTRICT: "район міста",
};

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" gutterBottom>
          Результати пошуку
        </Typography>
        <Alert severity="info">Введіть пошуковий запит на головній сторінці.</Alert>
      </Container>
    );
  }

  const results = await searchCombined(query, { limit: 30 });
  const ambiguousGroups = groupsRequiringDisambiguation(results);

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom component="h1">
            Результати пошуку: «{query}»
          </Typography>
          <SearchBox />
        </Box>

        {ambiguousGroups.size > 0 && (
          <Alert severity="warning">
            Знайдено кілька об’єктів з однаковою або схожою назвою. Оберіть потрібний, звіряючи адміністративний
            шлях — система не вгадує, який саме об’єкт мався на увазі.
          </Alert>
        )}

        {results.length === 0 && (
          <Alert severity="info">
            Нічого не знайдено за запитом «{query}». Перевірте написання або спробуйте код КАТОТТГ.
          </Alert>
        )}

        <Stack spacing={1.5}>
          {results.map((r) => (
            <Card key={r.territorialUnit.katottg} variant="outlined">
              <CardActionArea component={Link} href={`/territory/${encodeURIComponent(r.territorialUnit.katottg)}`}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="h6" component="span">
                      {r.territorialUnit.name}
                    </Typography>
                    <Chip size="small" label={TYPE_LABELS[r.territorialUnit.type] ?? r.territorialUnit.type} />
                    {r.territorialUnit.isDemoData && (
                      <Chip size="small" color="warning" variant="outlined" label="демо-дані" />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {r.administrativePath.map((p) => p.name).join(" → ")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Код КАТОТТГ: {r.territorialUnit.katottg}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
