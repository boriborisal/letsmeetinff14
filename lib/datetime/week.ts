// 주(week) 단위 시간 계산. 모든 시각은 KST(+09:00) 기준.
// SlotKey 포맷: "YYYY-MM-DDTHH:mm" (KST). 예: "2026-04-28T20:00"

import { addMinutes, formatSlotKey, parseSlotKey } from "@/lib/matching/reel";
import { FOOD_MIN, type SlotKey } from "@/types";

/** 임의 Date의 주 시작(월요일 00:00 KST) → "YYYY-MM-DD" */
export function weekStartIsoFromDate(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const dow = kst.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const daysFromMon = (dow + 6) % 7; // Mon=0
  const monday = new Date(
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - daysFromMon),
  );
  const yyyy = monday.getUTCFullYear();
  const mm = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(monday.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 현재 주 시작 */
export function currentWeekStart(): string {
  return weekStartIsoFromDate(new Date());
}

/** "YYYY-MM-DD" 월요일을 N주 ± 한 결과 */
export function shiftWeek(weekStart: string, deltaWeeks: number): string {
  const d = new Date(`${weekStart}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + deltaWeeks * 7);
  return weekStartIsoFromDate(d);
}

/** 주 7일의 날짜 라벨 (월~일) — 그리드 컬럼 헤더용 */
export interface DayHeader {
  iso: string;        // "YYYY-MM-DD"
  label: string;      // "5/4"
  dow: string;        // "월"
  isWeekend: boolean;
}
const DOW_KOR = ["월", "화", "수", "목", "금", "토", "일"];
export function weekDays(weekStart: string): DayHeader[] {
  const start = new Date(`${weekStart}T00:00:00+09:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getTime() + i * 24 * 60 * 60_000);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const month = kst.getUTCMonth() + 1;
    const day = kst.getUTCDate();
    const yyyy = kst.getUTCFullYear();
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return {
      iso: `${yyyy}-${mm}-${dd}`,
      label: `${month}/${day}`,
      dow: DOW_KOR[i]!,
      isWeekend: i === 5 || i === 6,
    };
  });
}

/**
 * dayOnly 모드의 고정 윈도우 스펙. buildDayWindow / weekWindowSlotKeys에 전달.
 *   startHHmm — 윈도우 시작 "HH:mm"
 *   slots     — 30분 슬롯 총 개수 (= duration / 30)
 */
export interface FixedWindowSpec {
  startHHmm: string;
  slots: number;
}

/**
 * 한 day의 표시 윈도우 슬롯 키 목록.
 * - timeGrid (fixed 없음): UI.md default — 18:00부터, tier별 1릴 길이로 나눠떨어지게.
 * - dayOnly  (fixed 있음): fixed.startHHmm부터 fixed.slots개.
 */
export interface DayWindow {
  startKey: SlotKey;
  slotKeys: SlotKey[];   // 길이 = totalSlots
  reelLen: number;       // 1릴 슬롯 수 (4/3/2)
  reelCount: number;     // 한 day의 1릴 개수
  hourLabels: { atIndex: number; label: string }[]; // 1릴 경계마다 좌측 시간 라벨
}

export function buildDayWindow(
  dayIso: string,
  reelLen: number,
  fixed?: FixedWindowSpec,
): DayWindow {
  let startKey: SlotKey;
  let totalSlots: number;
  let reelCount: number;
  if (fixed) {
    // dayOnly: 고정 시작 시각 + 고정 슬롯 수.
    startKey = `${dayIso}T${fixed.startHHmm}`;
    totalSlots = fixed.slots;
    reelCount = Math.floor(fixed.slots / reelLen);
  } else {
    // timeGrid: 18:00 시작. 적당한 reelCount: 4슬롯=4릴(8h), 3슬롯=5릴(7.5h), 2슬롯=8릴(8h).
    reelCount = reelLen === 4 ? 4 : reelLen === 3 ? 5 : 8;
    totalSlots = reelLen * reelCount;
    startKey = `${dayIso}T18:00`;
  }
  const keys: SlotKey[] = [];
  for (let i = 0; i < totalSlots; i++) {
    keys.push(addMinutes(startKey, i * FOOD_MIN));
  }
  // 1릴 경계 시간 라벨 (i = 0, reelLen, 2*reelLen, ... reelCount*reelLen)
  const hourLabels: { atIndex: number; label: string }[] = [];
  for (let r = 0; r <= reelCount; r++) {
    const idx = r * reelLen;
    const key = idx < keys.length ? keys[idx]! : addMinutes(keys[keys.length - 1]!, FOOD_MIN);
    const time = key.split("T")[1]!; // "HH:mm"
    hourLabels.push({ atIndex: idx, label: hhmm(time) });
  }
  return { startKey, slotKeys: keys, reelLen, reelCount, hourLabels };
}

function hhmm(s: string): string {
  // "20:00" → "20시", "20:30" → "20:30"
  const [h, m] = s.split(":");
  if (m === "00") return `${Number(h)}시`;
  return `${Number(h)}:${m}`;
}

/** 주 전체의 모든 슬롯 키 (7일 윈도우 합) — Firestore 저장 시 사용 */
export function weekWindowSlotKeys(
  weekStart: string,
  reelLen: number,
  fixed?: FixedWindowSpec,
): SlotKey[] {
  const days = weekDays(weekStart);
  const out: SlotKey[] = [];
  for (const d of days) {
    out.push(...buildDayWindow(d.iso, reelLen, fixed).slotKeys);
  }
  return out;
}

// ─────────────────────────────────────────────
// dayOnly 고정 시간 윈도우 — 검증 + 헬퍼
// ─────────────────────────────────────────────

/** "HH:mm" → 분(0~1439). 형식 오류면 null. */
function hhmmToMin(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** "HH:mm"에 분을 더한 "HH:mm" (24시간 wrap). */
export function shiftHHmm(hhmm: string, minutes: number): string {
  const base = hhmmToMin(hhmm) ?? 0;
  const total = (((base + minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface FixedWindowEval {
  ok: boolean;
  reason?: string;       // ok=false일 때 사용자에게 보일 사유
  slots: number;         // 30분 슬롯 수
  windowReels: number;   // 1릴 개수 (ok=true일 때만 의미)
  durationMin: number;   // 윈도우 길이(분)
}

/**
 * dayOnly 고정 윈도우 검증.
 * 종료 ≤ 시작이면 자정 넘김으로 해석. 윈도우 길이는 1릴의 양의 정수배여야 함.
 */
export function evaluateFixedWindow(
  fixedStart: string,
  fixedEnd: string,
  reelLen: number,
): FixedWindowEval {
  const s = hhmmToMin(fixedStart);
  const e = hhmmToMin(fixedEnd);
  const reelMin = reelLen * FOOD_MIN;
  if (s === null || e === null) {
    return { ok: false, reason: "시간 형식이 올바르지 않습니다.", slots: 0, windowReels: 0, durationMin: 0 };
  }
  const durationMin = (((e - s) % 1440) + 1440) % 1440;
  if (durationMin === 0) {
    return { ok: false, reason: "시작과 종료 시각이 같습니다.", slots: 0, windowReels: 0, durationMin: 0 };
  }
  if (durationMin % FOOD_MIN !== 0) {
    return { ok: false, reason: "30분 단위로 맞춰주세요.", slots: 0, windowReels: 0, durationMin };
  }
  const slots = durationMin / FOOD_MIN;
  if (durationMin % reelMin !== 0) {
    return {
      ok: false,
      reason: `1릴(${reelMin}분)의 배수가 되도록 맞춰주세요. (현재 ${durationMin}분)`,
      slots,
      windowReels: 0,
      durationMin,
    };
  }
  return { ok: true, slots, windowReels: durationMin / reelMin, durationMin };
}

/**
 * Party에서 dayOnly 고정 윈도우 스펙을 도출. timeGrid거나 설정 불완전/무효면 null.
 */
export function fixedWindowSpec(
  party: { scheduleMode?: string; fixedStart?: string; fixedEnd?: string },
  reelLen: number,
): FixedWindowSpec | null {
  if (party.scheduleMode !== "dayOnly" || !party.fixedStart || !party.fixedEnd) return null;
  const ev = evaluateFixedWindow(party.fixedStart, party.fixedEnd, reelLen);
  if (!ev.ok) return null;
  return { startHHmm: party.fixedStart, slots: ev.slots };
}

// re-export so call-sites don't need two imports
export { addMinutes, formatSlotKey, parseSlotKey };
