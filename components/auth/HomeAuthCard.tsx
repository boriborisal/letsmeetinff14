"use client";

// 홈 페이지 인증/공대 진입 카드.
//   - 비로그인: Discord 로그인 버튼
//   - 로그인: 공대 목록 + 공대 만들기 + 로그아웃

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { getUser } from "@/lib/firestore/users";
import { listMyParties } from "@/lib/firestore/parties";
import { getRaidContent } from "@/lib/raid/contents";
import type { Party } from "@/types";

export function HomeAuthCard() {
  const { user, loading, logout } = useAuth();
  const [parties, setParties] = useState<Party[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setParties(null);
      return;
    }
    (async () => {
      try {
        const u = await getUser(user.uid);
        const ids = u?.partyIds ?? [];
        const ps = await listMyParties(ids);
        if (!cancelled) setParties(ps);
      } catch (e) {
        console.error(e);
        if (!cancelled) setLoadError("공대 목록을 불러오지 못했습니다.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return <div className="h-12 w-64 animate-pulse rounded-md bg-secondary" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-md border border-border bg-secondary px-4 py-2 text-base font-medium transition hover:bg-accent"
      >
        Discord로 시작하기
      </Link>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-4 py-2 text-base">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt=""
              className="h-7 w-7 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <span className="font-medium">{user.displayName ?? "사용자"}</span>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          로그아웃
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">내 공대</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link
              href="/join"
              className="underline-offset-4 transition hover:text-foreground hover:underline"
            >
              초대 코드로 가입
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link
              href="/party/new"
              className="underline-offset-4 transition hover:text-foreground hover:underline"
            >
              + 공대 만들기
            </Link>
          </div>
        </div>

        {loadError ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {loadError}
          </p>
        ) : parties === null ? (
          <div className="h-16 animate-pulse rounded-md bg-secondary" />
        ) : parties.length === 0 ? (
          <p className="rounded-md border border-border bg-card px-4 py-6 text-center text-base text-muted-foreground">
            아직 소속된 공대가 없습니다.
            <br />
            공대를 만들거나 초대 코드로 가입해주세요.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {parties.map((p) => {
              const raid = getRaidContent(p.raidContentId);
              // 절은 짧은 약칭, 영식·극은 풀네임 (라벨이 길어지지만 식별 우선)
              const raidLabel =
                raid?.tier === "ultimate"
                  ? raid.shortKor ?? raid.nameKor
                  : raid?.nameKor ?? p.raidContentId;
              return (
                <li key={p.id}>
                  <Link
                    href={`/party/${p.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 text-base transition hover:bg-accent"
                  >
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">{raidLabel}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
