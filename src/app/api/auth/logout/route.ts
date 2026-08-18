import { apiSuccess } from "@/lib/api/response";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const response = apiSuccess({ loggedOut: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
