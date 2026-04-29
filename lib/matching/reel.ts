// 1릴(reel) 단위 출발 가능 판정.
//
// 1릴 = 연속된 N개의 30분 슬롯 (N = reelSlotsForTier(tier), 4 또는 3).
// 한 1릴이 "출발 가능" 조건:
//   1. 1릴의 모든 30분 슬롯에 응답한 멤버를 모은다.
//   2. 그 멤버들로 8자리 매칭이 성공해야 한다.

import {
  FOOD_MIN,
  reelSlotsForTier,
  type Availability,
  type Member,
  type RaidTier,
  type ReelFeasibility,
  type ReelWindow,
  type SlotKey,
} from "@/types";
import { matchSlots, memberCandidates } from "./slot";

// ─────────────────────────────────────────────
// SlotKey 헬퍼 — "YYYY-MM-DDTHH:mm" (KST)
// ─────────────────────────────────────────────

export function parseSlotKey(key: SlotKey): Date {
  // 서버 KST 가정. ISO에 +09:00 붙여 파싱.
  return new Date(`${key}:00+09:00`);
}

export function formatSlotKey(d: Date): SlotKey {
  // KST로 변환해서 분 단위까지 (Z 없이 로컬-KST 표기)
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  const HH = String(kst.getUTCHours()).padStart(2, "0");
  const MM = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
}

export function addMinutes(key: SlotKey, minutes: number): SlotKey {
  return formatSlotKey(new Date(parseSlotKey(key).getTime() + minutes * 60_000));
}

// 주(week) 단위 30분 슬롯 키 목록 — 월요일 0시부터 일요일 23:30까지
export function weekSlotKeys(weekStartIso: string /* "YYYY-MM-DD" 월요일 */): SlotKey[] {
  const out: SlotKey[] = [];
  const start = new Date(`${weekStartIso}T00:00:00+09:00`);
  for (let i = 0; i < 7 * 24 * (60 / FOOD_MIN); i++) {
    out.push(formatSlotKey(new Date(start.getTime() + i * FOOD_MIN * 60_000)));
  }
  return out;
}

// ─────────────────────────────────────────────
// 1릴 윈도우 생성
// ─────────────────────────────────────────────

/** 주어진 30분 슬롯 키 배열을 N슬롯짜리 1릴 윈도우들로 슬라이드 (sliding window). */
export function buildReelWindows(slotKeys: SlotKey[], tier: RaidTier): ReelWindow[] {
  const reelLen = reelSlotsForTier(tier);
  const out: ReelWindow[] = [];
  for (let i = 0; i + reelLen <= slotKeys.length; i++) {
    const window = slotKeys.slice(i, i + reelLen);
    // 연속성 검증: 각 슬롯이 직전 슬롯 + FOOD_MIN 이어야 함
    let contiguous = true;
    for (let j = 1; j < window.length; j++) {
      if (window[j] !== addMinutes(window[j - 1]!, FOOD_MIN)) {
        contiguous = false;
        break;
      }
    }
    if (!contiguous) continue;
    out.push({ startKey: window[0]!, slotKeys: window });
  }
  return out;
}

// ─────────────────────────────────────────────
// 출발 가능 판정
// ─────────────────────────────────────────────

export interface FeasibilityInput {
  tier: RaidTier;
  members: Pick<Member, "uid" | "mainSlot" | "changeSlots">[];
  availabilities: Pick<Availability, "uid" | "available">[];
  windows: ReelWindow[];
}

export function evaluateReels(input: FeasibilityInput): ReelFeasibility[] {
  const availSet = new Map<string, Set<SlotKey>>();
  for (const a of input.availabilities) {
    availSet.set(a.uid, new Set(a.available));
  }
  const candidatesByUid = new Map(
    input.members.map((m) => [m.uid, memberCandidates(m)] as const),
  );

  return input.windows.map((reel) => {
    const availableUids: string[] = [];
    for (const m of input.members) {
      const set = availSet.get(m.uid);
      if (!set) continue;
      const allIn = reel.slotKeys.every((k) => set.has(k));
      if (allIn) availableUids.push(m.uid);
    }

    const cands = availableUids
      .map((uid) => candidatesByUid.get(uid))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    const match = matchSlots(cands);

    return {
      reel,
      canDepart: match.canDepart,
      assignment: match.assignment,
      availableUids,
    };
  });
}

// ─────────────────────────────────────────────
// 연속 1릴 묶기 (UI 표기용)
// ─────────────────────────────────────────────

/** 출발 가능한 1릴 윈도우들을 시간순 + 연속(겹치든 인접하든)으로 그룹핑. */
export function groupConsecutiveDepartable(feas: ReelFeasibility[]): ReelFeasibility[][] {
  const departable = feas
    .filter((f) => f.canDepart)
    .sort((a, b) => (a.reel.startKey < b.reel.startKey ? -1 : 1));

  const groups: ReelFeasibility[][] = [];
  let cur: ReelFeasibility[] = [];
  for (const f of departable) {
    if (cur.length === 0) {
      cur.push(f);
      continue;
    }
    const prev = cur[cur.length - 1]!;
    const prevEnd = prev.reel.slotKeys[prev.reel.slotKeys.length - 1]!;
    // 인접·중첩 허용: 이번 시작이 prev 끝의 +30분 이내면 같은 그룹
    if (f.reel.startKey <= addMinutes(prevEnd, FOOD_MIN)) {
      cur.push(f);
    } else {
      groups.push(cur);
      cur = [f];
    }
  }
  if (cur.length) groups.push(cur);
  return groups;
}
