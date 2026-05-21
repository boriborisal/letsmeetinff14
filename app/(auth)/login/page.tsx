// 로그인 페이지. Discord OAuth 시작 링크 1개.
// 인앱 브라우저(디스코드 등)에서 열렸으면 외부 브라우저 유도 안내를 함께 표시.

import { headers } from "next/headers";
import { detectInAppBrowser } from "@/lib/auth/userAgent";
import { InAppBrowserNotice } from "@/components/auth/InAppBrowserNotice";

export const metadata = {
  title: "로그인 · Let's Meet in FF14",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // 로그인 후 돌아갈 경로 (예: /join?code=XXX). same-site path만 forward.
  const next =
    searchParams.next && searchParams.next.startsWith("/") && !searchParams.next.startsWith("//")
      ? searchParams.next
      : null;
  const loginHref = next
    ? `/api/auth/discord/login?next=${encodeURIComponent(next)}`
    : "/api/auth/discord/login";

  // UA로 인앱 브라우저 판별 (서버 렌더 시점).
  const { isInApp, appName } = detectInAppBrowser(headers().get("user-agent"));

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s Meet in FF14</h1>
          <p className="text-sm text-muted-foreground">
            FF14 한섭 레이드 공대 일정 조율
          </p>
        </header>

        {isInApp ? <InAppBrowserNotice appName={appName} /> : null}

        <a
          href={loginHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#5865F2] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#4752c4]"
        >
          <DiscordIcon className="h-5 w-5" />
          Discord로 로그인
        </a>

        <p className="text-xs text-muted-foreground">
          Discord 계정으로만 로그인할 수 있습니다.
        </p>
      </div>
    </main>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}
