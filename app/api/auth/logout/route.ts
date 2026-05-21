// 로그아웃: 클라이언트 sign-out 후 호출하면 서버측 쿠키를 모두 정리.
// (OAuth state 쿠키 + 세션 복구용 ff_session 쿠키.)

import { NextResponse } from "next/server";
import { STATE_COOKIE_NAME } from "@/lib/auth/state";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const runtime = "nodejs";

export function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STATE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  // 세션 쿠키도 제거 — 안 지우면 다음 방문 시 자동 복구돼 로그아웃이 무효화됨.
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
