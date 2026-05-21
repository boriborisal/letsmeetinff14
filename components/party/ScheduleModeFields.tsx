"use client";

// 공대 생성/수정 폼의 "일정 조율 방식" 영역.
// 모드 선택(timeGrid / dayOnly) + dayOnly일 때 고정 시간 입력 + 실시간 검증.
// 공대장은 언제든 방식을 바꿀 수 있고, 기존 응답은 새 방식 화면에 그대로 반영된다.
// 상태는 부모가 소유 — 이 컴포넌트는 표시 + 변경 콜백만.

import { useMemo } from "react";
import { evaluateFixedWindow } from "@/lib/datetime/week";
import type { ScheduleMode } from "@/types";

interface Props {
  reelLen: number;                 // 현재 선택 레이드의 1릴 슬롯 수
  mode: ScheduleMode;
  fixedStart: string;              // "HH:mm"
  fixedEnd: string;                // "HH:mm"
  onModeChange: (m: ScheduleMode) => void;
  onFixedChange: (start: string, end: string) => void;
  /** 수정 폼에서 공대의 원래 모드. 현재 mode와 다르면 전환 안내를 표시. 생성 폼에선 생략. */
  originalMode?: ScheduleMode;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 30];

function splitHHmm(s: string): [number, number] {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return [21, 30];
  return [Number(m[1]), Number(m[2])];
}
function joinHHmm(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const selectCls =
  "rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-foreground";

export function ScheduleModeFields({
  reelLen,
  mode,
  fixedStart,
  fixedEnd,
  onModeChange,
  onFixedChange,
  originalMode,
}: Props) {
  const [sh, sm] = splitHHmm(fixedStart);
  const [eh, em] = splitHHmm(fixedEnd);
  const ev = useMemo(
    () => evaluateFixedWindow(fixedStart, fixedEnd, reelLen),
    [fixedStart, fixedEnd, reelLen],
  );
  // 수정 폼에서 원래 모드와 달라졌으면 전환 안내 노출.
  const switching = originalMode !== undefined && mode !== originalMode;

  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground">일정 조율 방식</span>

      <div className="space-y-1.5">
        <ModeOption
          value="timeGrid"
          current={mode}
          onSelect={onModeChange}
          title="시간대 직접 선택"
          desc="30분 단위 그리드로 가능 시간 입력 (기존 방식)"
        />
        <ModeOption
          value="dayOnly"
          current={mode}
          onSelect={onModeChange}
          title="요일만 선택"
          desc="레이드 시간을 고정하고, 공대원은 가능한 요일만 응답"
        />
      </div>

      {switching ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
          {mode === "dayOnly" ? (
            <>
              공대원이 입력해둔 가능 시간은 지워지지 않아요. 단, 그 요일 시간대
              전체가 가능한 사람만 &ldquo;가능 요일&rdquo;로 잡힙니다 — 일부
              시간만 표시한 사람은 빠질 수 있어요.
            </>
          ) : (
            <>
              공대원이 골라둔 가능 요일은 지워지지 않아요. 시간별 화면에서 그
              요일의 고정 시간대가 가능으로 표시됩니다.
            </>
          )}
        </div>
      ) : null}

      {mode === "dayOnly" ? (
        <div className="space-y-1.5 rounded-md border border-border bg-secondary/50 p-2.5">
          <span className="text-xs text-muted-foreground">고정 레이드 시간</span>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <TimeSelect
              h={sh}
              m={sm}
              onChange={(h, mm) => onFixedChange(joinHHmm(h, mm), fixedEnd)}
            />
            <span className="text-muted-foreground">~</span>
            <TimeSelect
              h={eh}
              m={em}
              onChange={(h, mm) => onFixedChange(fixedStart, joinHHmm(h, mm))}
            />
          </div>
          <p
            className="text-xs"
            style={{
              color: ev.ok ? "var(--color-text-success)" : "var(--color-text-danger)",
            }}
          >
            {ev.ok
              ? `✓ ${ev.durationMin}분 — 1릴(${reelLen * 30}분) ${ev.windowReels}개`
              : `⚠ ${ev.reason}`}
          </p>
          <p className="text-xs text-muted-foreground">
            종료가 시작보다 빠르면 자정을 넘긴 것으로 봅니다 (예: 23:00~01:00).
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ModeOption({
  value,
  current,
  onSelect,
  title,
  desc,
}: {
  value: ScheduleMode;
  current: ScheduleMode;
  onSelect: (m: ScheduleMode) => void;
  title: string;
  desc: string;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition ${
        selected ? "border-foreground bg-accent" : "border-border hover:bg-accent/50"
      }`}
    >
      <span
        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
          selected ? "border-foreground" : "border-muted-foreground"
        }`}
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-foreground" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

function TimeSelect({
  h,
  m,
  onChange,
}: {
  h: number;
  m: number;
  onChange: (h: number, m: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <select
        value={h}
        onChange={(e) => onChange(Number(e.target.value), m)}
        className={selectCls}
        aria-label="시"
      >
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>
            {String(hh).padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground">:</span>
      <select
        value={m}
        onChange={(e) => onChange(h, Number(e.target.value))}
        className={selectCls}
        aria-label="분"
      >
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {String(mm).padStart(2, "0")}
          </option>
        ))}
      </select>
    </span>
  );
}
