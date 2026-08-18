"use client";

import * as React from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatDuration } from "@/lib/format/duration";

type SearchOption = { katottg: string; name: string; administrativePath: Array<{ name: string }> };
type CompareItem = { katottgQuery: string } & Record<string, unknown>;

const MAX_ITEMS = 10;

export default function ComparePage() {
  const [selected, setSelected] = React.useState<SearchOption[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<SearchOption[]>([]);
  const [asOfDate, setAsOfDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = React.useState<CompareItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (inputValue.trim().length < 2) {
      setOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(inputValue)}&limit=8`);
      if (res.ok) {
        const body = await res.json();
        setOptions(body.results ?? []);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  async function handleCompare() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ katottgCodes: selected.map((s) => s.katottg), asOfDate }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Не вдалося порівняти об'єкти.");
        return;
      }
      setItems(body.items);
    } catch {
      setError("Помилка мережі.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Порівняння територій
        </Typography>
        <Typography color="text.secondary">
          Оберіть до {MAX_ITEMS} населених пунктів або громад, щоб порівняти їхній правовий статус в одній таблиці.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
          <Autocomplete<SearchOption>
            sx={{ minWidth: 320, flexGrow: 1 }}
            options={options}
            filterOptions={(x) => x}
            getOptionLabel={(o) => o.name}
            onInputChange={(_e, v) => setInputValue(v)}
            onChange={(_e, value) => {
              if (value && selected.length < MAX_ITEMS && !selected.some((s) => s.katottg === value.katottg)) {
                setSelected((prev) => [...prev, value]);
              }
            }}
            renderInput={(params) => <TextField {...params} label="Додати об'єкт до порівняння" />}
          />
          <TextField
            type="date"
            label="Станом на дату"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        <Box>
          {selected.map((s) => (
            <Chip
              key={s.katottg}
              label={s.name}
              onDelete={() => setSelected((prev) => prev.filter((x) => x.katottg !== s.katottg))}
              deleteIcon={<DeleteIcon />}
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>

        <Button
          variant="contained"
          disabled={selected.length < 2 || loading}
          onClick={handleCompare}
          sx={{ alignSelf: "flex-start" }}
        >
          Порівняти ({selected.length})
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        {items && (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Об’єкт</TableCell>
                  <TableCell>Адміністративна належність</TableCell>
                  <TableCell>Поточна категорія</TableCell>
                  <TableCell>Дата початку</TableCell>
                  <TableCell>Дата завершення</TableCell>
                  <TableCell>Тривалість статусу</TableCell>
                  <TableCell>Нормативна підстава</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const outcome = item.outcome as string;
                  const matchedUnit = item.matchedUnit as { name: string } | undefined;
                  const administrativePath = item.administrativePath as Array<{ name: string }> | undefined;
                  const status = item.status as
                    | { officialLabel: string; startDate: string; endDate: string | null }
                    | undefined;
                  const legalBasis = item.legalBasis as Array<{ actTitle: string; actNumber: string }> | undefined;

                  return (
                    <TableRow key={item.katottgQuery}>
                      <TableCell>{matchedUnit?.name ?? item.katottgQuery}</TableCell>
                      <TableCell>{administrativePath?.map((p) => p.name).join(" → ") ?? "—"}</TableCell>
                      <TableCell>
                        {outcome === "FOUND_STATUS" ? status?.officialLabel : humanOutcome(outcome)}
                      </TableCell>
                      <TableCell>{status?.startDate ? status.startDate.slice(0, 10) : "—"}</TableCell>
                      <TableCell>{status?.endDate ? status.endDate.slice(0, 10) : status ? "не визначено" : "—"}</TableCell>
                      <TableCell>
                        {status
                          ? formatDuration(new Date(status.startDate), status.endDate ? new Date(status.endDate) : null, new Date(asOfDate))
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {legalBasis?.[0] ? `${legalBasis[0].actTitle} № ${legalBasis[0].actNumber}` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Stack>
    </Container>
  );
}

function humanOutcome(outcome: string): string {
  switch (outcome) {
    case "FOUND_NO_RECORD":
      return "запис відсутній";
    case "NEEDS_REVIEW":
      return "потребує перевірки";
    case "NO_REDACTION_FOR_DATE":
      return "немає редакції на дату";
    case "UNIT_NOT_FOUND":
      return "об'єкт не знайдено";
    default:
      return outcome;
  }
}
