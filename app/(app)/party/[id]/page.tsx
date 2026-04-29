"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { PartyInfoPanel } from "@/components/party/PartyInfoPanel";
import { AvailabilityPanel } from "@/components/availability/AvailabilityPanel";
import { getParty } from "@/lib/firestore/parties";
import { listPartyMembers } from "@/lib/firestore/members";
import type { Member, Party } from "@/types";

export default function PartyDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    Promise.all([getParty(id), listPartyMembers(id)])
      .then(([p, ms]) => {
        if (cancelled) return;
        if (!p) {
          setError("공대를 찾을 수 없습니다.");
          return;
        }
        setParty(p);
        setMembers(ms);
      })
      .catch(() => !cancelled && setError("공대 정보를 불러오지 못했습니다."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, user]);

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

  return (
    <main className="container max-w-7xl py-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <PartyInfoPanel
          party={party}
          members={members}
          myMember={myMember}
          uid={user.uid}
          onPartyUpdated={(p) => setParty(p)}
        />
        <AvailabilityPanel
          party={party}
          members={members}
          uid={user.uid}
        />
      </div>
    </main>
  );
}
