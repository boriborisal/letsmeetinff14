"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { PartyInfoPanel } from "@/components/party/PartyInfoPanel";
import { AvailabilityPanel } from "@/components/availability/AvailabilityPanel";
import { getParty } from "@/lib/firestore/parties";
import { subscribePartyMembers } from "@/lib/firestore/members";
import { subscribeWeekAvailabilities } from "@/lib/firestore/availability";
import { currentWeekStart } from "@/lib/datetime/week";
import type { Availability, Member, Party } from "@/types";

export default function PartyDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Firestore 룰은 비멤버의 parties/{id} read를 거절 — getParty()가 permission-denied로
  // 실패한다. "불러오기 실패"가 아니라 "가입되지 않은 공대"로 안내하기 위해 별도 구분.
  const [notMember, setNotMember] = useState(false);

  // 주 단위 상태 — 두 패널 공유 (lift)
  const [weekStart, setWeekStart] = useState(() => currentWeekStart());
  const [weekAvailabilities, setWeekAvailabilities] = useState<Availability[]>([]);

  // 공대 + 멤버 구독
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getParty(id)
      .then((p) => {
        if (cancelled) return;
        if (!p) setNotMember(true);
        else setParty(p);
      })
      .catch((err) => {
        if (cancelled) return;
        // permission-denied = 존재하지 않거나 비멤버 접근 (룰 상 둘을 구분할 수 없음).
        // 그 외(네트워크 등)는 일반 오류로 처리.
        if ((err as { code?: string })?.code === "permission-denied") {
          setNotMember(true);
        } else {
          setError("공대 정보를 불러오지 못했습니다.");
        }
      })
      .finally(() => !cancelled && setLoading(false));

    const unsub = subscribePartyMembers(id, (ms) => {
      if (cancelled) return;
      setMembers(ms);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [id, user]);

  // 주별 응답 실시간 구독 (week 변경 시 재구독)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const unsub = subscribeWeekAvailabilities(id, weekStart, (list) => {
      if (cancelled) return;
      setWeekAvailabilities(list);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [id, user, weekStart]);

  if (loading) {
    return <main className="container py-10 text-sm text-muted-foreground">불러오는 중…</main>;
  }
  if (notMember) {
    return (
      <main className="container space-y-4 py-10">
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold">가입되지 않은 공대입니다</h1>
          <p className="text-sm text-muted-foreground">
            이 링크는 공대원만 볼 수 있어요. 공대장에게 초대 코드(또는 가입 링크)를 요청해주세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/join"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
          >
            초대 코드로 가입하기
          </Link>
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
            홈으로
          </Link>
        </div>
      </main>
    );
  }
  if (error || !party || !members || !user) {
    return (
      <main className="container space-y-3 py-10">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/" className="text-sm text-muted-foreground underline">홈으로</Link>
      </main>
    );
  }

  const myMember = members.find((m) => m.uid === user.uid);
  if (!myMember) {
    return (
      <main className="container space-y-4 py-10">
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold">가입되지 않은 공대입니다</h1>
          <p className="text-sm text-muted-foreground">
            이 공대의 멤버가 아니에요. 공대장에게 초대 코드(또는 가입 링크)를 요청해주세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/join"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
          >
            초대 코드로 가입하기
          </Link>
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  // 제출 완료한 멤버 uid 집합 — 현재 보고 있는 주 기준
  const submittedUids = new Set(
    weekAvailabilities.filter((a) => a.submitted).map((a) => a.uid),
  );

  return (
    <main className="container max-w-7xl py-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <PartyInfoPanel
          party={party}
          members={members}
          myMember={myMember}
          uid={user.uid}
          submittedUids={submittedUids}
          weekStart={weekStart}
          weekAvailabilities={weekAvailabilities}
          onPartyUpdated={(p) => setParty(p)}
        />
        <AvailabilityPanel
          party={party}
          members={members}
          uid={user.uid}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
          weekAvailabilities={weekAvailabilities}
        />
      </div>
    </main>
  );
}
