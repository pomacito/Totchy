"use client";

import * as React from "react";
import { Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

export function ReportDownloadButton({
  katottg,
  asOfDate,
  format,
  label,
}: {
  katottg: string;
  asOfDate: string;
  format: "PDF" | "CSV";
  label: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SINGLE_TERRITORY",
          format,
          params: { katottg, asOfDate },
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Не вдалося сформувати звіт.");
        return;
      }
      const link = document.createElement("a");
      link.href = body.downloadUrl;
      link.click();
    } catch {
      setError("Помилка мережі під час формування звіту.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant={format === "PDF" ? "contained" : "outlined"}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={loading}
      >
        {label}
      </Button>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
