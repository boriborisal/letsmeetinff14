// (app) 라우트 그룹 — 로그인 필수 페이지 공통 레이아웃.
// MVP에선 클라이언트 사이드 가드만. 짧은 깜빡임은 허용.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // 로그인 후 원래 가려던 곳으로 돌아오게 next 파라미터에 현재 path 보존
      const next = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}` as never);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container flex h-12 items-center justify-between text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            {"Let's Meet in FF14"}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/bugs"
              title="버그리포트"
              aria-label="버그리포트"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary text-base transition hover:bg-accent"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="8" width="10" height="10" rx="4" />
                <path d="M7 12H3M21 12h-4M12 4v4M9 4l1.5 2M15 4l-1.5 2M4.5 19l3-2.2M19.5 19l-3-2.2" />
              </svg>
            </Link>
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
