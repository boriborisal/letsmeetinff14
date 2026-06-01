// 게시판 페이지(공지사항·버그리포트) 공통 헤더 — 홈 링크 + 타이틀.

import Link from "next/link";

interface Props {
  title: string;
  right?: React.ReactNode;
}

export function BoardHeader({ title, right }: Props) {
  return (
    <header className="border-b border-border">
      <div className="container flex h-12 items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-muted-foreground transition hover:text-foreground"
            aria-label="홈으로"
          >
            ← 홈
          </Link>
          <span aria-hidden className="text-muted-foreground/40">·</span>
          <h1 className="font-semibold">{title}</h1>
        </div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
    </header>
  );
}
