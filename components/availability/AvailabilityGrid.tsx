"use client";

// 가능 시간 그리드. INPUT 모드 (본인 입력) + RESULT 모드 (조회만, 출발 가능 강조 — 다음 라운드).
//
// UI.md 명세:
//   - 가로축 = 7일, 세로축 = 시간 (위 18시 → 아래)
//   - 1릴 단위 wrap (.av-reel)
//   - INPUT: 본인 .on (파랑), 다른 공대원 .h1~.h7 (초록 농도)
//   - 셀 클릭 토글, 드래그 페인팅 (mousedown 후 mouse over로 같은 상태 유지)

import { useCallback, useMemo, useRef } from "react";
import { TimeAxis } from "./TimeAxis";
import { buildDayWindow, weekDays } from "@/lib/datetime/week";
import type { SlotKey } from "@/types";

export type GridMode = "input" | "result";

export interface AvailabilityGridProps {
  weekStart: string;       // "YYYY-MM-DD" 월요일
  reelLen: number;         // 4 / 3 / 2
  mode: GridMode;
  /** 본인 응답 슬롯 키 집합 (INPUT 모드에서 토글) */
  selfSlots: Set<SlotKey>;
  /** 다른 공대원의 슬롯별 응답 카운트 */
  othersCount: Map<SlotKey, number>;
  /** 1 셀 토글 시 호출 (INPUT 모드) */
  onToggle?: (key: SlotKey, nextValue: boolean) => void;
  /** 출발 가능 1릴 시작 슬롯 키 집합 (RESULT 모드, 외곽선 표시용) */
  departReelStarts?: Set<SlotKey>;
}

export function AvailabilityGrid({
  weekStart,
  reelLen,
  mode,
  selfSlots,
  othersCount,
  onToggle,
  departReelStarts,
}: AvailabilityGridProps) {
  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const dayWindows = useMemo(
    () => days.map((d) => buildDayWindow(d.iso, reelLen)),
    [days, reelLen],
  );

  // 드래그 페인팅 상태
  const dragMode = useRef<null | "paint" | "erase">(null);

  const onCellMouseDown = useCallback(
    (key: SlotKey) => {
      if (mode !== "input" || !onToggle) return;
      const next = !selfSlots.has(key);
      dragMode.current = next ? "paint" : "erase";
      onToggle(key, next);
    },
    [mode, onToggle, selfSlots],
  );
  const onCellMouseEnter = useCallback(
    (key: SlotKey) => {
      if (mode !== "input" || !onToggle || !dragMode.current) return;
      const target = dragMode.current === "paint";
      if (selfSlots.has(key) === target) return;
      onToggle(key, target);
    },
    [mode, onToggle, selfSlots],
  );

  // 드래그 종료
  if (typeof window !== "undefined") {
    // 매 렌더마다 등록되면 안 되므로 useEffect에 두는 게 정석. 단순화 위해 글로벌 mouseup 핸들러를 한 번만.
  }

  return (
    <div
      className="av-grid"
      onMouseUp={() => {
        dragMode.current = null;
      }}
      onMouseLeave={() => {
        dragMode.current = null;
      }}
    >
      <TimeAxis
        hourLabels={dayWindows[0]?.hourLabels ?? []}
        reelLen={reelLen}
        reelCount={dayWindows[0]?.reelCount ?? 0}
      />
      <div className="av-cols">
        {days.map((day, di) => {
          const win = dayWindows[di]!;
          // 슬롯들을 reelLen 단위로 나누기
          const reels: SlotKey[][] = [];
          for (let i = 0; i < win.slotKeys.length; i += win.reelLen) {
            reels.push(win.slotKeys.slice(i, i + win.reelLen));
          }
          return (
            <div className="av-col" key={day.iso}>
              <div className={`av-head${day.isWeekend ? " we" : ""}`}>
                <span>{day.label}</span>
                <span className="dow">{day.dow}</span>
              </div>
              <div className="av-slots">
                {reels.map((reel, ri) => {
                  const reelStartKey = reel[0]!;
                  const ready = departReelStarts?.has(reelStartKey) ?? false;
                  return (
                    <div className={`av-reel${ready ? " ready" : ""}`} key={ri}>
                      {reel.map((key) => (
                        <Cell
                          key={key}
                          slotKey={key}
                          mode={mode}
                          on={selfSlots.has(key)}
                          othersN={othersCount.get(key) ?? 0}
                          onMouseDown={onCellMouseDown}
                          onMouseEnter={onCellMouseEnter}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CellProps {
  slotKey: SlotKey;
  mode: GridMode;
  on: boolean;
  othersN: number;
  onMouseDown?: (key: SlotKey) => void;
  onMouseEnter?: (key: SlotKey) => void;
}

function Cell({ slotKey, mode, on, othersN, onMouseDown, onMouseEnter }: CellProps) {
  const cls = ["s"];
  if (mode === "input") {
    if (on) {
      cls.push("on"); // 본인 응답 우선 표시 (덮어쓰기)
    } else if (othersN > 0) {
      cls.push(heatClass(othersN, 7));
    }
  } else {
    // RESULT 모드: 본인 포함 통합 카운트 (호출자가 othersN에 본인 합쳐서 전달)
    if (othersN > 0) cls.push(heatClass(othersN, 8));
    cls.push("readonly");
  }

  return (
    <div
      className={cls.join(" ")}
      title={slotKey}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown?.(slotKey);
      }}
      onMouseEnter={() => onMouseEnter?.(slotKey)}
      data-slot={slotKey}
    />
  );
}

function heatClass(n: number, max: number): string {
  if (n <= 0) return "";
  const clamped = Math.min(n, max);
  return `h${clamped}`;
}
