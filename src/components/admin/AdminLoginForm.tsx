"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error?.message ?? "Не вдалося увійти.");
        return;
      }
      router.refresh();
    } catch {
      setError("Помилка мережі.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="outlined" sx={{ maxWidth: 420 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Вхід до адміністративної панелі
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Демонстраційний обліковий запис: admin@demo.status-terytorii.invalid / DemoAdmin#2026 (див. README).
        </Alert>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={loading}>
            Увійти
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
