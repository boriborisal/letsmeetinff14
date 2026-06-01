"use client";

// 공지사항 작성 / 수정 폼. 운영자만 사용 (사용 측에서 라우트 가드).

import { useState } from "react";
import {
  createAnnouncement,
  updateAnnouncement,
} from "@/lib/firestore/announcementsClient";
import type { Announcement } from "@/types";

interface Props {
  mode: "create" | "edit";
  initial?: Announcement;
  onDone: (id: string) => void;
  onCancel: () => void;
}

export function AnnouncementForm({ mode, initial, onDone, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) {
      setError("제목과 본문을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "create") {
        const { id } = await createAnnouncement({ title: t, body: b, pinned });
        onDone(id);
      } else if (initial) {
        await updateAnnouncement(initial.id, { title: t, body: b, pinned });
        onDone(initial.id);
      }
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          제목
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="body" className="text-sm font-medium">
          본문
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          required
          rows={12}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
        />
        상단 고정
      </label>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-border bg-secondary px-4 py-2 text-sm transition hover:bg-accent disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition disabled:opacity-50"
        >
          {submitting
            ? mode === "create"
              ? "등록 중…"
              : "저장 중…"
            : mode === "create"
              ? "등록"
              : "저장"}
        </button>
      </div>
    </form>
  );
}
