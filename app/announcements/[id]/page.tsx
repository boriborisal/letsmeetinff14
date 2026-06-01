"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAnnouncement } from "@/lib/firestore/announcements";
import { deleteAnnouncement } from "@/lib/firestore/announcementsClient";
import { useAdmin } from "@/lib/auth/useAdmin";
import { BoardHeader } from "@/components/board/BoardHeader";
import { formatBoardDate } from "@/lib/datetime/format";
import type { Announcement } from "@/types";

export default function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [a, setA] = useState<Announcement | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAnnouncement(params.id).then((doc) => {
      if (!cancelled) setA(doc);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function onDelete() {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(params.id);
      router.replace("/announcements");
    } catch (e) {
      alert((e as Error).message);
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <BoardHeader
        title="공지사항"
        right={
          isAdmin && a ? (
            <>
              <Link
                href={`/announcements/${a.id}/edit`}
                className="rounded-md border border-border bg-secondary px-3 py-1 text-sm transition hover:bg-accent"
              >
                수정
              </Link>
              <button
                type="button"
                onClick={() => void onDelete()}
                disabled={deleting}
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-1 text-sm text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
              >
                {deleting ? "삭제 중…" : "삭제"}
              </button>
            </>
          ) : null
        }
      />
      <main className="container max-w-3xl space-y-4 py-6">
        {a === undefined ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : a === null ? (
          <p className="rounded-md border border-border bg-card px-4 py-8 text-center text-base text-muted-foreground">
            공지를 찾을 수 없습니다.
          </p>
        ) : (
          <article className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                {a.pinned ? (
                  <span className="rounded-sm bg-foreground/10 px-1.5 py-0.5 text-[11px] font-semibold">
                    고정
                  </span>
                ) : null}
                <h2 className="text-2xl font-bold">{a.title}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.authorName} · {formatBoardDate(a.createdAt)}
                {a.updatedAt ? ` (수정 ${formatBoardDate(a.updatedAt)})` : ""}
              </p>
            </div>
            <div className="whitespace-pre-wrap rounded-md border border-border bg-card px-4 py-4 text-base leading-relaxed">
              {a.body}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
