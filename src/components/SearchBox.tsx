"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Autocomplete, CircularProgress, Paper, TextField, Typography } from "@mui/material";

type SearchResultItem = {
  katottg: string;
  name: string;
  type: string;
  administrativePath: Array<{ name: string }>;
};

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<SearchResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (inputValue.trim().length < 2) {
      setOptions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(inputValue)}&limit=8`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const body = await res.json();
          setOptions(body.results ?? []);
        }
      } catch {
        // ігноруємо скасовані запити
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [inputValue]);

  return (
    <Autocomplete<SearchResultItem>
      options={options}
      filterOptions={(x) => x}
      loading={loading}
      autoHighlight
      autoFocus={autoFocus}
      getOptionLabel={(o) => o.name}
      onInputChange={(_e, value) => setInputValue(value)}
      onChange={(_e, value) => {
        if (value) router.push(`/territory/${encodeURIComponent(value.katottg)}`);
      }}
      noOptionsText={inputValue.trim().length < 2 ? "Введіть щонайменше 2 символи" : "Нічого не знайдено"}
      renderOption={(props, option) => (
        <li {...props} key={option.katottg}>
          <div>
            <Typography variant="body1">{option.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.administrativePath.map((p) => p.name).join(" → ")}
            </Typography>
          </div>
        </li>
      )}
      PaperComponent={(props) => <Paper elevation={3} {...props} />}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Назва населеного пункту, громади або код КАТОТТГ"
          placeholder="Наприклад: Вербівка"
          fullWidth
          size="medium"
          onKeyDown={(e) => {
            if (e.key === "Enter" && options.length === 0 && inputValue.trim().length >= 2) {
              router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
            }
          }}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
