"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/lib/auth/useAdmin";
import {
  deleteBugReportAsAdmin,
  deleteMyBugReport,
  getBugReport,
  updateBugReportAsAdmin,
  updateMyBugReport,
} from "@/lib/firestore/bugReports";
import { formatBoardDate } from "@/lib/datetime/format";
import { BUG_STATUS_KOR, type BugReport, type BugReportStatus } from "@/types";

const STATUS_STYLE: Record<BugReportStatus, string> = {
  open: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40",
  in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
};

export default function BugDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [r, setR] = useState<BugReport | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 본인 글 편집 모드 (인라인)
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  // 운영자 답변 작성/수정 모드
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    let cancelled = false;
    getBugReport(params.id).then((doc) => {
      if (!cancelled) setR(doc);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  function refresh() {
    void getBugReport(params.id).then(setR);
  }

  async function onDelete() {
    if (!r) return;
    if (!confirm("이 리포트를 삭제하시겠습니까?")) return;
    setBusy(true);
    setError(null);
    try {
      const isMine = user && r.authorUid === user.uid;
      if (isMine) {
        await deleteMyBugReport(r.id);
      } else {
        await deleteBugReportAsAdmin(r.id);
      }
      router.replace("/bugs");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function onSaveEdit() {
    if (!r) return;
    const t = editTitle.trim();
    const b = editBody.trim();
    if (!t || !b) {
      setError("제목과 본문을 입력해주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateMyBugReport(r.id, { title: t, body: b });
      setEditing(false);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onChangeStatus(s: BugReportStatus) {
    if (!r || r.status === s) return;
    setBusy(true);
    setError(null);
    try {
      await updateBugReportAsAdmin(r.id, { status: s });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onSaveReply() {
    if (!r) return;
    const trimmed = replyBody.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await updateBugReportAsAdmin(r.id, { replyBody: trimmed });
      setReplyOpen(false);
      setReplyBody("");
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteReply() {
    if (!r) return;
    if (!confirm("답변을 삭제하시겠습니까?")) return;
    setBusy(true);
    setError(null);
    try {
      await updateBugReportAsAdmin(r.id, { replyBody: null });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (r === undefined) {
    return (
      <main className="container max-w-3xl py-6 text-sm text-muted-foreground">불러오는 중…</main>
    );
  }
  if (r === null) {
    return (
      <main className="container max-w-3xl space-y-3 py-6">
        <p className="rounded-md border border-border bg-card px-4 py-8 text-center text-base text-muted-foreground">
          리포트를 찾을 수 없습니다.
        </p>
        <Link href="/bugs" className="text-sm text-muted-foreground underline">
          목록으로
        </Link>
      </main>
    );
  }

  const isMine = user && r.authorUid === user.uid;

  return (
    <main className="container max-w-3xl space-y-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/bugs" className="text-sm text-muted-foreground underline">
          ← 목록
        </Link>
        <div className="flex items-center gap-2">
          {(isMine || isAdmin) && !editing ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={busy}
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-1 text-sm text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
            >
              삭제
            </button>
          ) : null}
          {isMine && !editing ? (
            <button
              type="button"
              onClick={() => {
                setEditTitle(r.title);
                setEditBody(r.body);
                setEditing(true);
              }}
              className="rounded-md border border-border bg-secondary px-3 py-1 text-sm transition hover:bg-accent"
            >
              수정
            </button>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={120}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
          />
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            maxLength={5000}
            rows={12}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
              className="rounded-md border border-border bg-secondary px-4 py-2 text-sm transition hover:bg-accent disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void onSaveEdit()}
              disabled={busy}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition disabled:opacity-50"
            >
              {busy ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      ) : (
        <article className="space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}
              >
                {BUG_STATUS_KOR[r.status]}
              </span>
              <h2 className="text-2xl font-bold">{r.title}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {r.authorName} · {formatBoardDate(r.createdAt)}
              {r.updatedAt ? ` (수정 ${formatBoardDate(r.updatedAt)})` : ""}
            </p>
          </div>
          <div className="whitespace-pre-wrap rounded-md border border-border bg-card px-4 py-4 text-base leading-relaxed">
            {r.body}
          </div>
        </article>
      )}

      {isAdmin ? (
        <div className="space-y-2 rounded-md border border-dashed border-border bg-secondary/30 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            운영자 도구
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(["open", "in_progress", "resolved"] as BugReportStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void onChangeStatus(s)}
                disabled={busy || r.status === s}
                className={`rounded-md border px-2 py-1 text-xs transition disabled:opacity-50 ${
                  r.status === s ? STATUS_STYLE[s] : "border-border bg-background hover:bg-accent"
                }`}
              >
                {BUG_STATUS_KOR[s]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 답변 영역 */}
      {r.reply ? (
        <div className="space-y-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              운영자 답변 · {r.reply.repliedByName} · {formatBoardDate(r.reply.repliedAt)}
            </p>
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setReplyBody(r.reply?.body ?? "");
                    setReplyOpen(true);
                  }}
                  disabled={busy}
                  className="rounded-md border border-border bg-background px-2 py-0.5 text-xs transition hover:bg-accent disabled:opacity-50"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => void onDeleteReply()}
                  disabled={busy}
                  className="rounded-md border border-destructive/50 bg-destructive/10 px-2 py-0.5 text-xs text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            ) : null}
          </div>
          <p className="whitespace-pre-wrap text-base leading-relaxed">{r.reply.body}</p>
        </div>
      ) : isAdmin && !replyOpen ? (
        <button
          type="button"
          onClick={() => {
            setReplyBody("");
            setReplyOpen(true);
          }}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm transition hover:bg-accent"
        >
          + 답변 작성
        </button>
      ) : null}

      {replyOpen ? (
        <div className="space-y-2 rounded-md border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            답변 {r.reply ? "수정" : "작성"}
          </p>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            maxLength={5000}
            rows={6}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setReplyOpen(false);
                setReplyBody("");
              }}
              disabled={busy}
              className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm transition hover:bg-accent disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void onSaveReply()}
              disabled={busy || !replyBody.trim()}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition disabled:opacity-50"
            >
              {busy ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </main>
  );
}
