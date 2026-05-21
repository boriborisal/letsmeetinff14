"use client";

// 인앱 브라우저(디스코드 등)에서 로그인 페이지를 열었을 때 노출되는 안내.
// 인앱 웹뷰는 로그인 정보를 저장하지 않아 → 외부 브라우저로 유도한다.

import { useState } from "react";

export function InAppBrowserNotice({ appName }: { appName: string | null }) {
  const [copied, setCopied] = useState(false);
  const where = appName ?? "이 앱";

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API가 막힌 환경 — 수동 선택 fallback
      window.prompt("아래 주소를 복사해 기본 브라우저에 붙여넣어 주세요", url);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-left">
      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
        ⚠️ {where} 안에서는 로그인이 유지되지 않을 수 있어요
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {where} 인앱 브라우저는 로그인 정보를 저장하지 않아, 창을 닫으면 매번 다시
        로그인해야 합니다. 아래 버튼으로 주소를 복사한 뒤 <b>사파리·크롬 같은 기본
        브라우저</b>에서 열어주세요.
        {appName === "디스코드"
          ? ' 우측 상단 ··· 메뉴의 "브라우저에서 열기"를 눌러도 됩니다.'
          : ""}
      </p>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="w-full rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-500/25 dark:text-amber-300"
      >
        {copied ? "복사됨 ✓" : "주소 복사하기"}
      </button>
    </div>
  );
}
