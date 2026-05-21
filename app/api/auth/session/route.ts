// 세션 쿠키 발급 / 복구.
//   POST — 로그인 직후 클라가 ID 토큰 전달 → ff_session 쿠키 set (rolling 갱신 겸용)
//   GET  — 재방문 시 클라 세션이 비어 있을 때 복구용. 쿠키 검증 → 새 custom token 반환.
//
// 클라가 IndexedDB 세션을 잃어도(디스코드 인앱 브라우저 등) 이 쿠키로
// 디스코드 재로그인 없이 조용히 복구된다. lib/auth/session.ts 참고.

import { NextResponse, type NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  createSessionCookie,
  verifySessionCookie,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let idToken: string | undefined;
  try {
    const body = (await req.json()) as { idToken?: unknown };
    if (typeof body.idToken === "string") idToken = body.idToken;
  } catch {
    /* 본문 파싱 실패 → 아래에서 400 */
  }
  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }
  try {
    const cookie = await createSessionCookie(idToken);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, cookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return res;
  } catch (err) {
    console.error("[auth/session] create failed", err);
    return NextResponse.json({ error: "Session create failed" }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookie);

  if (!session) {
    // 무효·만료 쿠키는 지워서 다음 요청부터 깔끔하게.
    const res = NextResponse.json({ customToken: null });
    if (cookie) res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return res;
  }

  try {
    const customToken = await getAdminAuth().createCustomToken(session.uid, {
      provider: "discord",
      ...(session.discordId ? { discordId: session.discordId } : {}),
    });
    return NextResponse.json({ customToken });
  } catch (err) {
    console.error("[auth/session] recover failed", err);
    return NextResponse.json({ customToken: null }, { status: 500 });
  }
}
