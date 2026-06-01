"use client";

// 홈 화면 버그리포트 진입 카드. 비로그인 사용자는 로그인 페이지로 유도.

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function BugReportLinkCard() {
  const { user } = useAuth();
  const href = user ? "/bugs" : "/login?next=/bugs";

  return (
    <Link
      href={href}
      className="flex w-full max-w-md items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm transition hover:bg-accent"
    >
      <div>
        <p className="text-base font-medium">버그리포트 · 개선 제안</p>
        <p className="text-xs text-muted-foreground">
          오류·요청을 남기면 운영자가 확인하고 답변합니다.
        </p>
      </div>
      <span aria-hidden className="text-muted-foreground">→</span>
    </Link>
  );
}
