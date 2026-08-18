import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Container, Stack, Typography } from "@mui/material";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = { title: "Адміністрування" };

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Адміністративна панель
        </Typography>
        {!session ? (
          <AdminLoginForm />
        ) : (
          <AdminDashboard role={session.role} displayName={session.email} />
        )}
      </Stack>
    </Container>
  );
}
