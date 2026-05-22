"use client";

// dayOnly 모드의 가능 시간 입력/결과 — 요일 세로 리스트.
// 시간은 공대 설정으로 고정돼 있고, 공대원은 요일만 토글한다.
//
// 색 규칙은 시간 그리드(AvailabilityGrid)와 동일한 의미:
//   INPUT  — 본인 선택=파랑, 다른 공대원 수=초록 농도
//   RESULT — 통합 초록 농도, 출발 가능 요일=외곽선 강조
// 행에 숫자가 있어 농도는 그리드보다 옅게(보조 신호로) 쓴다.

import { useState } from "react";

export interface DayOnlyDayInfo {
  iso: string;          // "2026-05-19"
  label: string;        // "5/19"
  dow: string;          // "월"
  isWeekend: boolean;
  selfOn: boolean;      // 본인이 이 요일을 선택했는가
  othersN: number;      // 이 요일 가능한 다른 공대원 수
  departable: boolean;  // 8자리 매칭 성공 (출발 가능)
  names: string[];      // 이 요일 가능자 캐릭명 (본인 포함)
}

interface Props {
  mode: "input" | "result";
  days: DayOnlyDayInfo[];
  /** 농도 정규화 기준 — INPUT: 본인 제외 공대원 수, RESULT: 전체 공대원 수 */
  heatMax: number;
  /** INPUT 모드에서 요일 토글 시 호출. 없으면 읽기 전용. */
  onToggleDay?: (iso: string, next: boolean) => void;
  /** INPUT 모드에서 가운데 "다른 공대원 …" 인원 텍스트 숨김 (멤버 프로필 read-only 뷰 등). */
  hideOthers?: boolean;
}

// 행 배경 농도 — 그리드(.h1~.h8)보다 옅게 캡 (행엔 숫자가 있어 보조 신호로 충분).
const ROW_HEAT_ALPHA = [0.06, 0.12, 0.18, 0.25, 0.32, 0.39, 0.45, 0.52];

function heatBg(n: number, max: number): string | undefined {
  if (n <= 0) return undefined;
  const m = Math.max(1, max);
  const bucket = Math.min(8, Math.max(1, Math.ceil((Math.min(n, m) / m) * 8)));
  return `hsl(var(--heat-base) / ${ROW_HEAT_ALPHA[bucket - 1]})`;
}

export function DayOnlyGrid({ mode, days, heatMax, onToggleDay, hideOthers }: Props) {
  const [openIso, setOpenIso] = useState<string | null>(null);
  const editable = mode === "input" && !!onToggleDay;

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
      {days.map((d) => {
        // RESULT는 통합(본인+타인), INPUT은 타인 수만 농도로.
        const count = mode === "result" ? d.othersN + (d.selfOn ? 1 : 0) : d.othersN;
        const bg =
          mode === "input" && d.selfOn
            ? "var(--color-background-success)"
            : heatBg(count, heatMax);
        const expanded = openIso === d.iso;

        function onClick() {
          if (editable) {
            onToggleDay!(d.iso, !d.selfOn);
          } else if (mode === "result") {
            setOpenIso(expanded ? null : d.iso);
          }
        }

        return (
          <li key={d.iso}>
            <button
              type="button"
              onClick={onClick}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-base transition hover:brightness-110"
              style={{
                background: bg,
                // 출발 가능 요일은 내부 외곽선으로 강조 (그리드 .av-reel.ready와 동일 색)
                boxShadow: d.departable ? "inset 0 0 0 1.5px var(--color-text-info)" : undefined,
              }}
            >
              {/* 요일 + 날짜 */}
              <span className="flex w-16 shrink-0 items-baseline gap-1">
                <span
                  className="font-medium"
                  style={d.isWeekend ? { color: "var(--color-text-danger)" } : undefined}
                >
                  {d.dow}
                </span>
                <span className="text-[15px] text-muted-foreground">{d.label}</span>
              </span>

              {/* 가운데: 인원 */}
              <span className="flex-1 text-[15px] text-muted-foreground">
                {mode === "input"
                  ? hideOthers
                    ? null
                    : d.othersN > 0
                      ? `다른 공대원 ${d.othersN}명`
                      : "다른 공대원 없음"
                  : `응답 ${count}명`}
              </span>

              {/* 우측: 상태 */}
              {mode === "input" ? (
                <span
                  className="shrink-0 text-[15px] font-medium"
                  style={d.selfOn ? { color: "var(--color-text-success)" } : undefined}
                >
                  {d.selfOn ? "● 가능" : "○ 미선택"}
                </span>
              ) : (
                <span
                  className="shrink-0 text-[15px] font-medium"
                  style={{
                    color: d.departable
                      ? "var(--color-text-info)"
                      : "var(--color-text-secondary)",
                  }}
                >
                  {d.departable ? "✦ 출발 가능" : "출발 불가"}
                </span>
              )}
            </button>

            {/* RESULT 모드: 행 펼치면 가능자 명단 */}
            {mode === "result" && expanded ? (
              <div className="bg-card px-3 py-2 text-[15px] text-muted-foreground">
                {d.names.length > 0 ? (
                  <span>가능 ({d.names.length}): {d.names.join(", ")}</span>
                ) : (
                  <span>이 요일에 가능한 공대원이 없습니다.</span>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
