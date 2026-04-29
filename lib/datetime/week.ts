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
 * 한 day의 표시 윈도우 슬롯 키 목록.
 * UI.md: 18:00 → 02:00 (다음날) 까지가 default, 8시간 = 16개 30분 슬롯.
 * tier별 1릴 길이로 나눠떨어지게 윈도우 길이를 약간 조정.
 */
export interface DayWindow {
  startKey: SlotKey;
  slotKeys: SlotKey[];   // 길이 = totalSlots
  reelLen: number;       // 1릴 슬롯 수 (4/3/2)
  reelCount: number;     // 한 day의 1릴 개수
  hourLabels: { atIndex: number; label: string }[]; // 1릴 경계마다 좌측 시간 라벨
}

export function buildDayWindow(dayIso: string, reelLen: number): DayWindow {
  // 18:00 시작. 2슬롯=1h, 3슬롯=1.5h, 4슬롯=2h.
  // 윈도우 끝은 18:00 + reelCount * reelLen * 30분.
  // 적당한 reelCount: 4슬롯=4릴(8h), 3슬롯=5릴(7.5h), 2슬롯=8릴(8h).
  const reelCount = reelLen === 4 ? 4 : reelLen === 3 ? 5 : 8;
  const totalSlots = reelLen * reelCount;
  const startKey = `${dayIso}T18:00`;
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
export function weekWindowSlotKeys(weekStart: string, reelLen: number): SlotKey[] {
  const days = weekDays(weekStart);
  const out: SlotKey[] = [];
  for (const d of days) {
    out.push(...buildDayWindow(d.iso, reelLen).slotKeys);
  }
  return out;
}

// re-export so call-sites don't need two imports
export { addMinutes, formatSlotKey, parseSlotKey };
