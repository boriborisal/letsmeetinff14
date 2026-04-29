// (app) 라우트 그룹 — 로그인 필수 페이지 공통 레이아웃.
// MVP에선 클라이언트 사이드 가드만. 짧은 깜빡임은 허용.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
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
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                className="h-6 w-6 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <span className="text-foreground">{user.displayName ?? "사용자"}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              로그아웃
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
