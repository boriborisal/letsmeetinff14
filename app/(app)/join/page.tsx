"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinPartyByCode } from "@/lib/firestore/joinClient";

export default function JoinPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(() => (params.get("code") ?? "").toUpperCase());
  const [charName, setCharName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return setError("초대 코드를 입력해주세요.");
    if (!charName.trim()) return setError("본인 캐릭명을 입력해주세요.");

    setSubmitting(true);
    setError(null);
    try {
      const { partyId } = await joinPartyByCode({
        inviteCode: code.trim(),
        charName: charName.trim(),
      });
      router.replace(`/party/${partyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "가입에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <main className="container max-w-md py-10">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">초대 코드로 가입</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        공대장에게 받은 6자 코드를 입력하세요.
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="code" className="text-xs text-muted-foreground">
            초대 코드
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="char" className="text-xs text-muted-foreground">
            본인 캐릭명
          </label>
          <input
            id="char"
            type="text"
            value={charName}
            onChange={(e) => setCharName(e.target.value)}
            maxLength={30}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <p className="text-xs text-muted-foreground">
            서버·직업·자리는 가입 후 프로필에서 설정합니다.
          </p>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition disabled:opacity-50"
        >
          {submitting ? "가입 중…" : "가입하기"}
        </button>
      </form>
    </main>
  );
}
