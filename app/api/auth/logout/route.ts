// 로그아웃: 클라이언트 sign-out 후 호출하면 OAuth 관련 쿠키 정리.
// (Firebase 세션 자체는 클라이언트 SDK가 IndexedDB에 유지 — 클라이언트가 signOut() 호출.)

import { NextResponse } from "next/server";
import { STATE_COOKIE_NAME } from "@/lib/auth/state";

export const runtime = "nodejs";

export function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STATE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
