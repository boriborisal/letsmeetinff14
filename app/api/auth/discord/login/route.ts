// Discord OAuth 시작점.
// GET /api/auth/discord/login → state 발급, 쿠키 set, Discord 인가 페이지로 redirect.

import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/discord/oauth";
import { createState, STATE_COOKIE_NAME, STATE_COOKIE_MAX_AGE } from "@/lib/auth/state";

export const runtime = "nodejs"; // crypto + firebase-admin 필요
export const dynamic = "force-dynamic";

export function GET() {
  const state = createState();
  const redirectUrl = buildAuthorizeUrl(state.value);

  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set(STATE_COOKIE_NAME, state.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STATE_COOKIE_MAX_AGE,
  });
  return res;
}
