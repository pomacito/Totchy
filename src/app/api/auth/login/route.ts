import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getClientKey } from "@/lib/api/rateLimit";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`login:${getClientKey(request)}`);
  if (!rate.allowed) {
    return apiError("RATE_LIMITED", "Забагато спроб входу. Спробуйте пізніше.");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Тіло запиту має бути коректним JSON.");
  }
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Некоректний email або пароль.");
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return apiError("UNAUTHORIZED", "Невірний email або пароль.");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = createSessionToken({ userId: user.id, email: user.email, role: user.role });
  const response = apiSuccess({ email: user.email, role: user.role, displayName: user.displayName });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
