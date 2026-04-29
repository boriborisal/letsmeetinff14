// OAuth state CSRF 보호.
// 흐름: /login → 랜덤 nonce 생성 → HMAC 서명 → 쿠키 + Discord state 파라미터로 전달
//      → 콜백에서 쿠키와 state 파라미터 일치 + HMAC 유효 검증

import "server-only";
import crypto from "node:crypto";

const STATE_COOKIE = "ff_oauth_state";
const STATE_TTL_MS = 10 * 60_000; // 10분

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

/** 새 state 생성. 쿠키에 넣을 값과 Discord에 보낼 값(둘 다 동일). */
export function createState(): { value: string } {
  const nonce = crypto.randomBytes(16).toString("hex");
  const issuedAt = Date.now().toString();
  const payload = `${nonce}.${issuedAt}`;
  const sig = sign(payload);
  return { value: `${payload}.${sig}` };
}

/** 콜백에서 검증. 쿠키 값 vs state 파라미터 일치 + 서명 유효 + TTL 통과 */
export function verifyState(cookieValue: string | undefined, paramValue: string | null): boolean {
  if (!cookieValue || !paramValue) return false;
  if (cookieValue !== paramValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;
  const [nonce, issuedAtStr, sig] = parts as [string, string, string];
  const expected = sign(`${nonce}.${issuedAtStr}`);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > STATE_TTL_MS) return false;
  return true;
}

export const STATE_COOKIE_NAME = STATE_COOKIE;
export const STATE_COOKIE_MAX_AGE = STATE_TTL_MS / 1000;
