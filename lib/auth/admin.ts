// 사이트 운영자 판정 — 환경변수 ADMIN_UIDS (쉼표 구분) 화이트리스트.
// 절대 NEXT_PUBLIC_ 접두사 쓰지 말 것 (uid 외부 노출 방지).
// 클라이언트는 /api/me 응답의 isAdmin 플래그로만 자기 권한 확인.

import "server-only";

let cached: Set<string> | null = null;

function parseAdminUids(): Set<string> {
  if (cached) return cached;
  const raw = process.env.ADMIN_UIDS ?? "";
  cached = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return cached;
}

export function isAdminUid(uid: string | null | undefined): boolean {
  if (!uid) return false;
  return parseAdminUids().has(uid);
}
