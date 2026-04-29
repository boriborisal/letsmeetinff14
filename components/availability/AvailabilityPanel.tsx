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
import { saveMyAvailability } from "@/lib/firestore/availability";
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
import { shiftWeek, weekWindowSlotKeys } from "@/lib/datetime/week";

interface Props {
  party: Party;
  members: Member[];
  uid: string;
  weekStart: string;
  onWeekChange: (next: string) => void;
  weekAvailabilities: Availability[];
}

export function AvailabilityPanel({
  party,
  members,
  uid,
  weekStart,
  onWeekChange,
  weekAvailabilities,
}: Props) {
  const raid = useMemo(() => getRaidContent(party.raidContentId), [party.raidContentId]);
  const tier = raid?.tier ?? "ultimate";
  const reelLen = useMemo(() => reelSlotsForTier(tier), [tier]);
  const isLeader = uid === party.leaderUid;

  // 본인 응답 / 드래프트 상태
  const [savedSlots, setSavedSlots] = useState<Set<SlotKey>>(new Set());
  const [draftSlots, setDraftSlots] = useState<Set<SlotKey>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 부모에서 받은 주별 응답을 본인 vs 다른 공대원으로 분리
  const myAvail = useMemo(
    () => weekAvailabilities.find((a) => a.uid === uid),
    [weekAvailabilities, uid],
  );
  const othersAvail = useMemo(
    () => weekAvailabilities.filter((a) => a.uid !== uid),
    [weekAvailabilities, uid],
  );

  // 본인 응답이 외부(자신의 다른 탭이나 직접 DB)에서 변경된 경우 sync
  useEffect(() => {
    const saved = new Set(myAvail?.available ?? []);
    setSavedSlots(saved);
    setSubmitted(myAvail?.submitted ?? false);
  }, [myAvail]);

  // 주가 바뀌면 편집 상태 초기화 + draft를 새 saved로
  useEffect(() => {
    setEditing(false);
    setDraftSlots(new Set(myAvail?.available ?? []));
    // weekStart 변경 시 한 번만 — myAvail이 같이 바뀌어 위 useEffect가 saved도 업데이트
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const editable = !submitted || editing;
  // 편집 가능 상태(제출 전 또는 수정 중)에선 draft, 잠금 상태에선 saved를 표시.
  const selfSlots = editable ? draftSlots : savedSlots;
  const dirty = editing && !setEqual(draftSlots, savedSlots);
  const weekLoading = false; // 부모가 구독으로 즉시 데이터 제공

  // 슬롯별 다른 공대원 카운트 (INPUT 편집 시)
  const othersCount = useMemo(() => {
    const m = new Map<SlotKey, number>();
    for (const a of othersAvail) {
      for (const k of a.available) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [othersAvail]);

  // 슬롯별 가능한 사람 캐릭명 목록 (본인 포함, 툴팁용)
  const namesPerSlot = useMemo(() => {
    const map = new Map<SlotKey, string[]>();
    const memberByUid = new Map(members.map((m) => [m.uid, m]));
    const all: { uid: string; available: SlotKey[] }[] = [
      ...othersAvail.map((a) => ({ uid: a.uid, available: a.available })),
      { uid, available: Array.from(selfSlots) },
    ];
    for (const a of all) {
      const m = memberByUid.get(a.uid);
      if (!m) continue;
      for (const k of a.available) {
        const arr = map.get(k);
        if (arr) arr.push(m.charName);
        else map.set(k, [m.charName]);
      }
    }
    return map;
  }, [othersAvail, selfSlots, uid, members]);

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
        onPrev={() => onWeekChange(shiftWeek(weekStart, -1))}
        onNext={() => onWeekChange(shiftWeek(weekStart, +1))}
      />

      <ScheduleList
        partyId={party.id}
        weekStart={weekStart}
        uid={uid}
        isLeader={isLeader}
        members={members}
      />

      <Legend mode={gridMode} totalOthers={totalOthers} reelLen={reelLen} />

      {!weekLoading ? (
        <RecommendationCard
          feasibility={feasibility}
          partyId={party.id}
          isLeader={isLeader}
          uid={uid}
          reelsPerSession={party.reelsPerSession ?? 1}
          onConfirmed={() => { /* 일정 확정은 ScheduleList가 자체 onSnapshot으로 갱신 */ }}
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
            getNamesAt={(k) => namesPerSlot.get(k) ?? []}
            // 편집 중엔 툴팁 자체 비활성 (모바일에서 호버가 클릭에 끌려가서 거슬림)
            disableTooltip={editable}
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
