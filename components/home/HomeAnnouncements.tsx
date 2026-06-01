"use client";

// 홈 화면 인라인 공지사항 (최근 3개). 비로그인 사용자에게도 표시.

import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribeAnnouncements } from "@/lib/firestore/announcements";
import { formatBoardDate } from "@/lib/datetime/format";
import type { Announcement } from "@/types";

const MAX_HOME = 3;

export function HomeAnnouncements() {
  const [list, setList] = useState<Announcement[] | null>(null);

  useEffect(() => {
    const unsub = subscribeAnnouncements((items) => setList(items), MAX_HOME);
    return () => unsub();
  }, []);

  return (
    <section className="w-full max-w-md space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">공지사항</h2>
        <Link
          href="/announcements"
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          전체 보기 →
        </Link>
      </div>

      {list === null ? (
        <div className="h-16 animate-pulse rounded-md bg-secondary" />
      ) : list.length === 0 ? (
        <p className="rounded-md border border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          아직 공지사항이 없습니다.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((a) => (
            <li key={a.id}>
              <Link
                href={`/announcements/${a.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm transition hover:bg-accent"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {a.pinned ? (
                    <span className="shrink-0 rounded-sm bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold">
                      고정
                    </span>
                  ) : null}
                  <span className="truncate">{a.title}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBoardDate(a.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
