"use client";

// 버그리포트 목록. 로그인 사용자 공개. (app) 그룹이라 로그인 가드 자동 적용.

import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribeBugReports } from "@/lib/firestore/bugReports";
import { formatBoardDate } from "@/lib/datetime/format";
import { BUG_STATUS_KOR, type BugReport } from "@/types";

const STATUS_STYLE: Record<BugReport["status"], string> = {
  open: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40",
  in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
};

export default function BugsPage() {
  const [list, setList] = useState<BugReport[] | null>(null);

  useEffect(() => {
    const unsub = subscribeBugReports((items) => setList(items));
    return () => unsub();
  }, []);

  return (
    <main className="container max-w-3xl py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">버그리포트</h1>
          <p className="text-sm text-muted-foreground">
            오류·개선 제안. 다른 사용자도 볼 수 있습니다.
          </p>
        </div>
        <Link
          href="/bugs/new"
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
        >
          + 새 리포트
        </Link>
      </div>

      {list === null ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="rounded-md border border-border bg-card px-4 py-8 text-center text-base text-muted-foreground">
          아직 등록된 리포트가 없습니다.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id}>
              <Link
                href={`/bugs/${r.id}`}
                className="block rounded-md border border-border bg-card px-4 py-3 transition hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`shrink-0 rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}
                  >
                    {BUG_STATUS_KOR[r.status]}
                  </span>
                  <span className="truncate text-base font-medium">{r.title}</span>
                  {r.reply ? (
                    <span className="shrink-0 text-xs text-muted-foreground">· 답변</span>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.body}</p>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  {r.authorName} · {formatBoardDate(r.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
