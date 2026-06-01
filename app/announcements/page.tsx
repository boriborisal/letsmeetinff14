"use client";

// 공지사항 목록. 비로그인 포함 모두 볼 수 있음.

import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribeAnnouncements } from "@/lib/firestore/announcements";
import { useAdmin } from "@/lib/auth/useAdmin";
import { BoardHeader } from "@/components/board/BoardHeader";
import { formatBoardDate } from "@/lib/datetime/format";
import type { Announcement } from "@/types";

export default function AnnouncementsPage() {
  const [list, setList] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const unsub = subscribeAnnouncements((items) => setList(items));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (list !== null) setError(null);
  }, [list]);

  return (
    <div className="min-h-screen">
      <BoardHeader
        title="공지사항"
        right={
          isAdmin ? (
            <Link
              href="/announcements/new"
              className="rounded-md border border-border bg-secondary px-3 py-1 text-sm font-medium transition hover:bg-accent"
            >
              + 새 공지
            </Link>
          ) : null
        }
      />
      <main className="container max-w-3xl py-6">
        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : list === null ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : list.length === 0 ? (
          <p className="rounded-md border border-border bg-card px-4 py-8 text-center text-base text-muted-foreground">
            아직 공지사항이 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/announcements/${a.id}`}
                  className="block rounded-md border border-border bg-card px-4 py-3 transition hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    {a.pinned ? (
                      <span className="rounded-sm bg-foreground/10 px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
                        고정
                      </span>
                    ) : null}
                    <span className="truncate text-base font-medium">{a.title}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    {a.authorName} · {formatBoardDate(a.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
