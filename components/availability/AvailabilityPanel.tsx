"use client";

// 가능 시간 입력 + 결과 (한 화면 통합).
//
// 상태 머신 (입력 잠금 토글):
//   1) !submitted             → 입력 가능, [제출]
//   2) submitted && !editing  → 잠금(본인 셀이 통합 초록), [수정]
//   3) submitted && editing   → 다시 입력 가능, [취소] [다시 제출]
//
// 어느 상태든 출발 가능 1릴 외곽선 + 추천 카드는 상시 표시.
// 편집 중에도 toggle 결과가 즉시 외곽선/추천에 반영됨 (live preview).

import { useCallback, useEffect, useMemo, useState } from "react";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { WeekNavigator } from "./WeekNavigator";
import { Legend } from "./Legend";
import { RecommendationCard } from "./RecommendationCard";
import { ScheduleList } from "@/components/schedule/ScheduleList";
import {
  getMyAvailability,
  listWeekAvailabilities,
  saveMyAvailability,
} from "@/lib/firestore/availability";
import { getRaidContent } from "@/lib/raid/contents";
import { buildReelWindows, evaluateReels } from "@/lib/matching/reel";
import {
  reelSlotsForTier,
  type Availability,
  type Member,
  type Party,
  type ReelFeasibility,
  type SlotKey,
} from "@/types";
import {
  currentWeekStart,
  shiftWeek,
  weekWindowSlotKeys,
} from "@/lib/datetime/week";

interface Props {
  party: Party;
  myMember: Member;
  members: Member[];
  uid: string;
}

export function AvailabilityPanel({ party, myMember, members, uid }: Props) {
  const raid = useMemo(() => getRaidContent(party.raidContentId), [party.raidContentId]);
  const tier = raid?.tier ?? "ultimate";
  const reelLen = useMemo(() => reelSlotsForTier(tier), [tier]);
  const isLeader = uid === party.leaderUid;

  const [weekStart, setWeekStart] = useState(() => currentWeekStart());

  // 응답 상태
  const [savedSlots, setSavedSlots] = useState<Set<SlotKey>>(new Set()); // 서버에 저장된 본인 응답
  const [draftSlots, setDraftSlots] = useState<Set<SlotKey>>(new Set()); // 편집 중 로컬 드래프트
  const [othersAvail, setOthersAvail] = useState<Availability[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false); // submit 후 "수정" 클릭 → true

  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [weekLoading, setWeekLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const editable = !submitted || editing;
  const selfSlots = editing ? draftSlots : savedSlots;
  const dirty = editing && !setEqual(draftSlots, savedSlots);

  // 데이터 로드
  useEffect(() => {
    let cancelled = false;
    setWeekLoading(true);
    (async () => {
      try {
        const [mine, all] = await Promise.all([
          getMyAvailability(party.id, uid, weekStart),
          listWeekAvailabilities(party.id, weekStart),
        ]);
        if (cancelled) return;
        const saved = new Set(mine?.available ?? []);
        setSavedSlots(saved);
        setDraftSlots(new Set(saved));
        setSubmitted(mine?.submitted ?? false);
        setEditing(false);
        setOthersAvail(all.filter((a) => a.uid !== uid));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setWeekLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [party.id, uid, weekStart, reloadKey]);

  // 슬롯별 다른 공대원 카운트 (INPUT 편집 시)
  const othersCount = useMemo(() => {
    const m = new Map<SlotKey, number>();
    for (const a of othersAvail) {
      for (const k of a.available) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [othersAvail]);

  // 통합 카운트 (잠금 또는 RESULT — 본인 포함)
  const integratedCount = useMemo(() => {
    const m = new Map<SlotKey, number>(othersCount);
    for (const k of selfSlots) m.set(k, (m.get(k) ?? 0) + 1);
    return m;
  }, [othersCount, selfSlots]);

  // 출발 가능 1릴 (상시 — 편집 중에도 selfSlots(=draft) 기준 live preview)
  const feasibility: ReelFeasibility[] = useMemo(() => {
    const slotKeys = weekWindowSlotKeys(weekStart, reelLen);
    const windows = buildReelWindows(slotKeys, tier);
    const allAvail: { uid: string; available: SlotKey[] }[] = [
      ...othersAvail.map((a) => ({ uid: a.uid, available: a.available })),
      { uid, available: Array.from(selfSlots) },
    ];
    return evaluateReels({
      tier,
      members,
      availabilities: allAvail,
      windows,
    });
  }, [weekStart, reelLen, tier, othersAvail, selfSlots, uid, members]);

  const departReelStarts = useMemo(
    () => new Set(feasibility.filter((f) => f.canDepart).map((f) => f.reel.startKey)),
    [feasibility],
  );

  // 셀 토글 (편집 가능할 때만)
  const onToggle = useCallback(
    (key: SlotKey, nextValue: boolean) => {
      if (!editable) return;
      setDraftSlots((prev) => {
        const next = new Set(prev);
        if (nextValue) next.add(key);
        else next.delete(key);
        return next;
      });
    },
    [editable],
  );

  async function submit() {
    setSubmitting(true);
    setSaveError(null);
    try {
      const validKeys = new Set(weekWindowSlotKeys(weekStart, reelLen));
      const filtered = Array.from(draftSlots).filter((k) => validKeys.has(k));
      await saveMyAvailability({
        partyId: party.id,
        uid,
        weekStart,
        available: filtered,
        submitted: true,
      });
      const newSaved = new Set(filtered);
      setSavedSlots(newSaved);
      setDraftSlots(newSaved);
      setSubmitted(true);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setSaveError("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing() {
    setDraftSlots(new Set(savedSlots));
    setEditing(true);
  }

  function cancelEditing() {
    setDraftSlots(new Set(savedSlots));
    setEditing(false);
  }

  const totalOthers = Math.max(0, members.length - 1);

  // 그리드 렌더링 — 항상 외곽선 표시.
  //   - 편집 가능: 본인=파랑(.on), 다른 공대원=.h1~.h7
  //   - 잠금: 통합 .h1~.h8 (본인 포함)
  const gridMode = editable ? "input" : "result";
  const gridCount = editable ? othersCount : integratedCount;
  const gridDepartStarts = departReelStarts;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-medium">가능 시간</h2>
        <p className="text-[15px] text-muted-foreground">
          {editable
            ? "30분 단위, 셀 클릭/드래그로 토글 — 출발 가능 1릴은 외곽선으로 강조"
            : "제출 완료 — 통합 결과로 표시"}
        </p>
      </div>

      <WeekNavigator
        weekStart={weekStart}
        onPrev={() => setWeekStart((w) => shiftWeek(w, -1))}
        onNext={() => setWeekStart((w) => shiftWeek(w, +1))}
      />

      <ScheduleList
        partyId={party.id}
        weekStart={weekStart}
        uid={uid}
        isLeader={isLeader}
        members={members}
        reloadKey={reloadKey}
      />

      <Legend mode={gridMode} totalOthers={totalOthers} reelLen={reelLen} />

      {!weekLoading ? (
        <RecommendationCard
          feasibility={feasibility}
          partyId={party.id}
          isLeader={isLeader}
          uid={uid}
          onConfirmed={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

      <div className="rounded-md border border-border bg-card p-3">
        {weekLoading ? (
          <p className="py-12 text-center text-base text-muted-foreground">로딩…</p>
        ) : (
          <AvailabilityGrid
            weekStart={weekStart}
            reelLen={reelLen}
            mode={gridMode}
            selfSlots={selfSlots}
            othersCount={gridCount}
            onToggle={editable ? onToggle : undefined}
            departReelStarts={gridDepartStarts}
          />
        )}
      </div>

      {saveError ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-base text-destructive">
          {saveError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
          <p className="text-base text-muted-foreground">
            {!submitted
              ? "아직 제출 전"
              : editing
              ? `수정 중${dirty ? " · 변경 사항 있음" : ""}`
              : "제출됨"}
          </p>
          <div className="flex items-center gap-2">
            {!submitted ? (
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting}
                className="rounded-md bg-foreground px-3 py-1.5 text-base font-medium text-background transition disabled:opacity-50"
              >
                {submitting ? "제출 중…" : "제출"}
              </button>
            ) : editing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={submitting}
                  className="rounded-md border border-border bg-secondary px-3 py-1.5 text-base transition hover:bg-accent disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting || !dirty}
                  className="rounded-md bg-foreground px-3 py-1.5 text-base font-medium text-background transition disabled:opacity-50"
                >
                  {submitting ? "제출 중…" : "다시 제출"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-border bg-secondary px-3 py-1.5 text-base transition hover:bg-accent"
              >
                수정
              </button>
            )}
          </div>
        </div>
    </section>
  );
}

function setEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}
