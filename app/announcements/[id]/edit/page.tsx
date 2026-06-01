"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnnouncement } from "@/lib/firestore/announcements";
import { useAdmin } from "@/lib/auth/useAdmin";
import { BoardHeader } from "@/components/board/BoardHeader";
import { AnnouncementForm } from "@/components/board/AnnouncementForm";
import type { Announcement } from "@/types";

export default function EditAnnouncementPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [a, setA] = useState<Announcement | null | undefined>(undefined);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace(`/announcements/${params.id}`);
    }
  }, [loading, isAdmin, router, params.id]);

  useEffect(() => {
    let cancelled = false;
    getAnnouncement(params.id).then((doc) => {
      if (!cancelled) setA(doc);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BoardHeader title="공지사항 수정" />
      <main className="container max-w-3xl py-6">
        {a === undefined ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : a === null ? (
          <p className="rounded-md border border-border bg-card px-4 py-8 text-center text-base text-muted-foreground">
            공지를 찾을 수 없습니다.
          </p>
        ) : (
          <AnnouncementForm
            mode="edit"
            initial={a}
            onDone={() => router.replace(`/announcements/${a.id}`)}
            onCancel={() => router.replace(`/announcements/${a.id}`)}
          />
        )}
      </main>
    </div>
  );
}
