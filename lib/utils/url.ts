// URL 안전 검증 — 사용자 입력 URL을 href로 렌더링 전 통과시킬 것.
// http(s)만 허용. javascript:/data: 등 차단.

export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!/^https?:\/\/.+/i.test(trimmed)) return null;
  return trimmed;
}
