"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/auth/useAdmin";
import { BoardHeader } from "@/components/board/BoardHeader";
import { AnnouncementForm } from "@/components/board/AnnouncementForm";

export default function NewAnnouncementPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/announcements");
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BoardHeader title="공지사항 작성" />
      <main className="container max-w-3xl py-6">
        <AnnouncementForm
          mode="create"
          onDone={(id) => router.replace(`/announcements/${id}`)}
          onCancel={() => router.replace("/announcements")}
        />
      </main>
    </div>
  );
}
