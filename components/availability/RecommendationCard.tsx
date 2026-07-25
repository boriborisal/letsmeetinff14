"use client";

// 출발 가능 1릴 그룹 중 추천 + 그 외 출발 가능 시간 목록.
// 우선순위: 가장 긴 연속 그룹. 동률이면 주말(토/일) 우선.

import { useMemo, useState } from "react";
import { describeReelRange, reelEndKey } from "@/lib/datetime/format";
import { groupConsecutiveDepartable } from "@/lib/matching/reel";
import { createSchedule } from "@/lib/firestore/schedules";
import { FOOD_MIN, type ReelFeasibility, type SlotKey } from "@/types";

interface Props {
  feasibility: ReelFeasibility[];
  partyId: string;
  isLeader: boolean;
  uid: string;
  reelsPerSession: number;     // 공대 설정. 추천/확정 길이 단위
  onConfirmed: () => void;
}

export function RecommendationCard({
  feasibility,
  partyId,
  isLeader,
  uid,
  reelsPerSession,
  onConfirmed,
}: Props) {
  // 연속 1릴 그룹 → reelsPerSession 길이 sliding window로 후보 생성
  const candidates = useMemo(() => {
    const groups = groupConsecutiveDepartable(feasibility);
    const out: ReelFeasibility[][] = [];
    for (const g of groups) {
      if (g.length < reelsPerSession) continue;
      for (let i = 0; i + reelsPerSession <= g.length; i++) {
        out.push(g.slice(i, i + reelsPerSession));
      }
    }
    return out;
  }, [feasibility, reelsPerSession]);

  // 추천: 주말 시작 우선, 그 외 시간 빠른 순
  const recommended = useMemo(() => {
    if (candidates.length === 0) return null;
    const sorted = [...candidates].sort((a, b) => {
      const aWe = isWeekendStart(a[0]!.reel.startKey);
      const bWe = isWeekendStart(b[0]!.reel.startKey);
      if (aWe && !bWe) return -1;
      if (!aWe && bWe) return 1;
      return a[0]!.reel.startKey < b[0]!.reel.startKey ? -1 : 1;
    });
    return sorted[0]!;
  }, [candidates]);

  const others = useMemo(
    () =>
      recommended
        ? candidates.filter((c) => c[0]!.reel.startKey !== recommended[0]!.reel.startKey)
        : [],
    [candidates, recommended],
  );

  if (!recommended) {
    return (
      <div className="space-y-2">
        <div className="rounded-md border border-border bg-card px-4 py-3 text-base text-muted-foreground">
          ({reelsPerSession}릴) 출발 가능한 시간이 아직 없습니다. 모든 공대원의 응답이 모이면 표시됩니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <RecommendedBlock
        group={recommended}
        partyId={partyId}
        isLeader={isLeader}
        uid={uid}
        onConfirmed={onConfirmed}
        emphasis
      />
      {others.length > 0 ? (
        <details className="rounded-md border border-border bg-card px-3 py-2">
          <summary className="cursor-pointer select-none text-base text-muted-foreground">
            다른 출발 가능 시간 ({others.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {others.map((g, i) => (
              <li key={i}>
                <RecommendedBlock
                  group={g}
                  partyId={partyId}
                  isLeader={isLeader}
                  uid={uid}
                  onConfirmed={onConfirmed}
                  emphasis={false}
                />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function RecommendedBlock({
  group,
  partyId,
  isLeader,
  uid,
  onConfirmed,
  emphasis,
}: {
  group: ReelFeasibility[];
  partyId: string;
  isLeader: boolean;
  uid: string;
  onConfirmed: () => void;
  emphasis: boolean;
}) {
  const start = group[0]!.reel.startKey;
  const lastReel = group[group.length - 1]!.reel;
  const end = reelEndKey(lastReel.slotKeys[lastReel.slotKeys.length - 1]!, FOOD_MIN);
  const reelCount = group.length;
  const reelLen = group[0]!.reel.slotKeys.length;
  const totalMin = reelCount * reelLen * FOOD_MIN;
  const totalLabel =
    totalMin >= 60
      ? `${Math.floor(totalMin / 60)}시간${totalMin % 60 ? ` ${totalMin % 60}분` : ""}`
      : `${totalMin}분`;

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    if (!isLeader) return;
    setConfirming(true);
    setError(null);
    try {
      await createSchedule({
        partyId,
        reelStart: start,
        reelEnd: end,
        confirmedBy: uid,
      });
      setConfirmed(true);
      onConfirmed();
    } catch (err) {
      console.error(err);
      setError("일정 확정에 실패했습니다.");
      setConfirming(false);
    }
  }

  const containerCls = emphasis
    ? "flex flex-col gap-2 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    : "flex flex-col gap-2 px-1 py-1 sm:flex-row sm:items-center sm:justify-between";
  const containerStyle = emphasis
    ? {
        background: "var(--color-background-success)",
        borderColor: "var(--color-text-success)",
      }
    : undefined;

  return (
    <div className={containerCls} style={containerStyle}>
      <div className="space-y-0.5">
        {emphasis ? (
          <p className="text-[15px] font-medium" style={{ color: "var(--color-text-success)" }}>
            가장 추천하는 시간
          </p>
        ) : null}
        <p className={emphasis ? "text-base font-medium" : "text-base"}>
          {describeReelRange(start, end)}
        </p>
        <p className="text-[15px] text-muted-foreground">
          {reelCount}릴 ({totalLabel}), 전원 가능
        </p>
      </div>

      {isLeader ? (
        confirmed ? (
          <span className="text-base" style={{ color: "var(--color-text-success)" }}>
            ✓ 확정됨
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={confirming}
            className="shrink-0 rounded-md bg-foreground px-3 py-1.5 text-base font-medium text-background transition disabled:opacity-50"
          >
            {confirming ? "확정 중…" : "이 시간으로 확정"}
          </button>
        )
      ) : null}

      {error ? (
        <p className="text-base text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function isWeekendStart(key: SlotKey): boolean {
  const datePart = key.split("T")[0]!;
  const [yyyy, mm, dd] = datePart.split("-").map(Number) as [number, number, number];
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}
