import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./session";

export type GuardResult = { ok: true; session: SessionPayload } | { ok: false; reason: "UNAUTHORIZED" | "FORBIDDEN" };

export function requireRole(request: NextRequest, allowedRoles: UserRole[]): GuardResult {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return { ok: false, reason: "UNAUTHORIZED" };
  if (!allowedRoles.includes(session.role)) return { ok: false, reason: "FORBIDDEN" };
  return { ok: true, session };
}
