import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE_NAME = "status_terytorii_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 годин

export type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "APP_SESSION_SECRET не встановлено або закороткий. Задайте випадкове значення у .env."
    );
  }
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("hex");
}

/**
 * Спрощена сесійна модель для адміністративної панелі MVP: підписаний
 * cookie без зовнішніх залежностей (JWT-бібліотек тощо). Не реалізує MFA —
 * задокументовано як відоме обмеження в docs/KNOWN_LIMITATIONS.md.
 */
export function createSessionToken(payload: Omit<SessionPayload, "issuedAt" | "expiresAt">): string {
  const now = Date.now();
  const full: SessionPayload = { ...payload, issuedAt: now, expiresAt: now + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedSignature = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hasRole(payload: SessionPayload | null, allowed: UserRole[]): boolean {
  if (!payload) return false;
  return allowed.includes(payload.role);
}
