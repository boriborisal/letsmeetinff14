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
        if (!p) setError("공대를 찾을 수 없습니다.");
        else setParty(p);
      })
      .catch(() => !cancelled && setError("공대 정보를 불러오지 못했습니다."))
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
      <main className="container space-y-3 py-10">
        <p className="text-sm text-destructive">이 공대의 멤버가 아닙니다.</p>
        <Link href="/" className="text-sm text-muted-foreground underline">홈으로</Link>
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
