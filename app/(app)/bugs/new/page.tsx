"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBugReport } from "@/lib/firestore/bugReports";
import { getConsoleLog } from "@/lib/logging/consoleBuffer";
import type { BugReportDebugInfo } from "@/types";

export default function NewBugReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachLog, setAttachLog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) {
      setError("제목과 본문을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const debugInfo: BugReportDebugInfo | undefined = attachLog
        ? {
            url: window.location.href,
            userAgent: navigator.userAgent,
            screen: `${window.screen.width}x${window.screen.height}`,
            online: navigator.onLine,
            consoleLog: getConsoleLog(),
            capturedAt: Date.now(),
          }
        : undefined;
      const id = await createBugReport({
        title: t,
        body: b,
        authorName: user.displayName ?? "사용자",
        debugInfo,
      });
      router.replace(`/bugs/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main className="container max-w-3xl py-6">
      <h1 className="mb-4 text-xl font-semibold">새 버그리포트</h1>
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
            placeholder="간단히 무슨 일이 있었는지"
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
            placeholder="재현 단계, 사용 기기/브라우저, 기대한 결과 등을 적어주세요."
            maxLength={5000}
            required
            rows={12}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-base"
          />
        </div>

        <label className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={attachLog}
            onChange={(e) => setAttachLog(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            로그 첨부
            <span className="mt-0.5 block text-xs text-muted-foreground">
              현재 화면 URL, 브라우저 정보, 최근 콘솔 에러 기록을 함께 보냅니다. 원인 파악에
              도움이 돼요. 운영자와 본인만 확인할 수 있습니다.
            </span>
          </span>
        </label>

        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.replace("/bugs")}
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
            {submitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>
    </main>
  );
}
