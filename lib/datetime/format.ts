// SlotKey ↔ 사람 친화 포맷 변환.

import { addMinutes } from "@/lib/matching/reel";
import type { SlotKey } from "@/types";

const DOW_KOR = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-05-06T19:00" → { dow: "수", date: "5/6", time: "19:00" } */
export function describeSlot(key: SlotKey): { dow: string; date: string; time: string } {
  const [datePart, timePart] = key.split("T") as [string, string];
  const [yyyy, mm, dd] = datePart.split("-").map(Number) as [number, number, number];
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  const dow = DOW_KOR[d.getUTCDay()]!;
  return { dow, date: `${mm}/${dd}`, time: timePart };
}

/** 1릴 또는 연속 1릴 그룹의 표시 문자열. ex) "수 5/6 19:00 — 21:00" */
export function describeReelRange(reelStart: SlotKey, reelEnd: SlotKey): string {
  const a = describeSlot(reelStart);
  const b = describeSlot(reelEnd);
  // 같은 날 내라면 종료 날짜 생략
  if (a.date === b.date) {
    return `${a.dow} ${a.date} ${a.time} — ${b.time}`;
  }
  // 다음날 새벽으로 넘어가면
  return `${a.dow} ${a.date} ${a.time} — ${b.date} ${b.time}`;
}

/** end key는 마지막 30분 슬롯의 *종료* 시각 = 다음 슬롯 시작 */
export function reelEndKey(lastSlotKey: SlotKey, foodMin = 30): SlotKey {
  return addMinutes(lastSlotKey, foodMin);
}

/** unix ms → 게시판 날짜 표시. 오늘은 "HH:mm", 어제는 "어제", 그 외는 "YYYY-MM-DD". KST 기준. */
export function formatBoardDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const y = String(now.getFullYear());
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return yyyy === Number(y) ? `${mm}-${dd}` : `${yyyy}-${mm}-${dd}`;
}
