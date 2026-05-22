"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkPartyMembership, joinPartyByCode } from "@/lib/firestore/joinClient";

export default function JoinPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialCode = (params.get("code") ?? "").toUpperCase();
  const [code, setCode] = useState(initialCode);
  const [charName, setCharName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 초대 링크(?code=)로 진입한 경우, 이미 그 공대 멤버라면 폼 없이 바로 공대로 이동.
  // 확인이 끝날 때까지 폼 대신 로딩 화면을 보여준다.
  const [checking, setChecking] = useState(initialCode.length > 0);

  useEffect(() => {
    if (!initialCode) return;
    let cancelled = false;
    void (async () => {
      try {
        const { partyId, alreadyMember } = await checkPartyMembership(initialCode);
        if (cancelled) return;
        if (alreadyMember) {
          router.replace(`/party/${partyId}`);
          return; // 이동 중 — checking 유지해 폼이 깜빡 노출되지 않게.
        }
      } catch {
        // 확인 실패(잘못된 코드 등)는 무시 — 사용자가 폼에서 직접 입력 가능.
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCode, router]);

  if (checking) {
    return (
      <main className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
        확인 중…
      </main>
    );
  }

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
