// Discord OAuth 콜백.
// 1. state 검증 (CSRF)
// 2. code → access_token 교환
// 3. Discord 사용자 정보 조회
// 4. Firebase Admin으로 Custom Token 발급 (uid = "discord:{discordId}")
// 5. HTML 응답으로 클라이언트에 토큰 전달 → signInWithCustomToken → 홈으로 redirect

import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, fetchDiscordUser, discordAvatarUrl } from "@/lib/discord/oauth";
import { verifyState, STATE_COOKIE_NAME } from "@/lib/auth/state";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const stateCookie = req.cookies.get(STATE_COOKIE_NAME)?.value;

  if (!verifyState(stateCookie, stateParam)) {
    return errorResponse("Invalid OAuth state", 400);
  }
  if (!code) {
    return errorResponse("Missing code", 400);
  }

  try {
    const tokens = await exchangeCode(code);
    const user = await fetchDiscordUser(tokens.access_token);
    const uid = `discord:${user.id}`;

    const customToken = await getAdminAuth().createCustomToken(uid, {
      provider: "discord",
      discordId: user.id,
    });

    const displayName = user.global_name ?? user.username;
    const photoURL = discordAvatarUrl(user);

    // Firebase Auth: updateUser → 없으면 createUser
    try {
      await getAdminAuth().updateUser(uid, { displayName, photoURL: photoURL ?? undefined });
    } catch {
      await getAdminAuth().createUser({ uid, displayName, photoURL: photoURL ?? undefined });
    }

    // Firestore users/{uid} 업서트. createdAt은 신규 생성 시에만 set.
    const userRef = getAdminDb().collection("users").doc(uid);
    const snap = await userRef.get();
    const baseDoc = {
      uid,
      discordId: user.id,
      discordUsername: displayName,
      discordAvatarUrl: photoURL ?? null,
    };
    if (snap.exists) {
      await userRef.update(baseDoc);
    } else {
      await userRef.set({ ...baseDoc, createdAt: Date.now() });
    }

    // 로그인 시작 시 set한 next 쿠키가 있으면 그곳으로, 없으면 "/"
    const nextCookie = req.cookies.get("ff_oauth_next")?.value;
    const safeNext =
      nextCookie && nextCookie.startsWith("/") && !nextCookie.startsWith("//")
        ? nextCookie
        : "/";

    const html = renderCompleteHtml(customToken, safeNext);
    const res = new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
    // state / next 쿠키 1회용 — 즉시 삭제
    res.cookies.set(STATE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    res.cookies.set("ff_oauth_next", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    console.error("[discord/callback] failed", err);
    return errorResponse("Login failed", 500);
  }
}

// ─────────────────────────────────────────────
// 클라이언트 인계 HTML — Custom Token으로 sign-in 후 홈으로 redirect.
// 별도 페이지 만들지 않고 콜백에서 바로 그림.
// ─────────────────────────────────────────────

function renderCompleteHtml(customToken: string, nextPath: string): string {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
  // Custom Token + cfg 모두 클라이언트 노출 OK.
  // (Custom Token은 단일 sign-in 1회용; cfg는 NEXT_PUBLIC_)
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>로그인 처리 중…</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #ddd;
             display: grid; place-items: center; height: 100vh; margin: 0; }
      .box { text-align: center; }
    </style>
  </head>
  <body>
    <div class="box">
      <p>로그인 처리 중…</p>
    </div>
    <script type="module">
      import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
      import { getAuth, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

      const config = ${JSON.stringify(cfg)};
      const token = ${JSON.stringify(customToken)};
      const next = ${JSON.stringify(nextPath)};

      const app = getApps()[0] ?? initializeApp(config);
      const auth = getAuth(app);
      try {
        const cred = await signInWithCustomToken(auth, token);
        // 세션 쿠키 발급 — 클라 저장소(IndexedDB)가 휘발돼도 로그인 복구 가능하게.
        // 실패해도 로그인 자체는 계속 진행 (쿠키는 부가 안전장치).
        try {
          const idToken = await cred.user.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
        } catch (_) { /* noop */ }
        window.location.replace(next);
      } catch (e) {
        document.querySelector(".box").innerHTML =
          "<p>로그인 실패</p><pre>" + (e?.message ?? e) + "</pre>";
      }
    </script>
  </body>
</html>`;
}
