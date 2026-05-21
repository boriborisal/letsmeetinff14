// Firebase 세션 쿠키 — 클라이언트 IndexedDB가 휘발돼도 로그인이 유지되도록
// 서버가 들고 있는 httpOnly 세션. (디스코드 인앱 브라우저 등 웹뷰 대응)
//
// 흐름:
//   로그인 직후 → 클라가 ID 토큰을 POST → createSessionCookie → ff_session 쿠키
//   재방문 시   → 클라 세션 없음 → 쿠키 검증 → 새 custom token 발급 →
//                 클라가 signInWithCustomToken 으로 조용히 복구 (디스코드 재로그인 X)

import "server-only";
import { getAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "ff_session";

// Firebase 세션 쿠키 최대 수명 = 14일 (Firebase 한도). ms 단위.
export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** ID 토큰 → 세션 쿠키 문자열. 토큰이 무효하면 throw. */
export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_TTL_MS });
}

export interface RecoveredSession {
  uid: string;
  discordId?: string;
}

/** 세션 쿠키 검증 → uid + discordId. 무효·만료·폐기 시 null. */
export async function verifySessionCookie(
  cookie: string | undefined,
): Promise<RecoveredSession | null> {
  if (!cookie) return null;
  try {
    // 두 번째 인자 true = 폐기(revoke) 여부까지 확인 — 삭제된 계정 복구 차단.
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      discordId: typeof decoded.discordId === "string" ? decoded.discordId : undefined,
    };
  } catch {
    return null;
  }
}
