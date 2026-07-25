"use client";

// 최근 console.error/warn + 미처리 예외를 링버퍼로 보관.
// 버그리포트 작성 시 "로그 첨부" 선택 시에만 읽어서 함께 제출한다 — 상시 서버 전송 없음.

const MAX_LINES = 30;
const buffer: string[] = [];
let installed = false;

function stringifyArg(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function push(line: string) {
  buffer.push(line);
  if (buffer.length > MAX_LINES) buffer.shift();
}

/** 앱 시작 시 한 번만 호출 (AuthProvider에서). 중복 설치 방지. */
export function installConsoleCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  (["error", "warn"] as const).forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      try {
        push(`[${level}] ${args.map(stringifyArg).join(" ")}`);
      } catch {
        /* 로깅 실패는 무시 — 원본 console 호출은 계속 진행 */
      }
      original(...args);
    };
  });

  window.addEventListener("error", (e) => {
    push(`[uncaught] ${e.message} (${e.filename}:${e.lineno})`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    push(`[unhandledrejection] ${stringifyArg(e.reason)}`);
  });
}

/** 현재까지 쌓인 로그 스냅샷 (오래된 순). */
export function getConsoleLog(): string[] {
  return [...buffer];
}
