import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return apiSuccess({ authenticated: false });
  }
  return apiSuccess({
    authenticated: true,
    email: session.email,
    role: session.role,
    expiresAt: new Date(session.expiresAt).toISOString(),
  });
}
