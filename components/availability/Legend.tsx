"use client";

import type { GridMode } from "./AvailabilityGrid";

interface Props {
  mode: GridMode;
  totalOthers: number; // INPUT 모드: 본인 제외한 공대원 수 (max 7)
  reelLen: number;
}

export function Legend({ mode, totalOthers, reelLen }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px] text-muted-foreground">
      {mode === "input" ? (
        <>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: "var(--color-background-info)" }}
            />
            본인 가능
          </span>
          <span className="inline-flex items-center gap-1">
            다른 공대원 (1 → {totalOthers}명)
            <Ramp max={Math.min(totalOthers, 7)} />
          </span>
        </>
      ) : (
        <>
          <span className="inline-flex items-center gap-1">
            전원 가능 정도 (1 → 8명)
            <Ramp max={8} />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm border-[1.5px]"
              style={{ borderColor: "var(--color-text-info)" }}
            />
            출발 가능 1릴
          </span>
        </>
      )}
      <span>1릴 = {reelLen} 슬롯 ({reelLen * 30}분)</span>
    </div>
  );
}

function Ramp({ max }: { max: number }) {
  const arr = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <span className="inline-flex">
      {arr.map((n) => (
        <span
          key={n}
          className={`s h${n} inline-block`}
          style={{ width: 10, height: 10, marginRight: 1, borderRadius: 2 }}
        />
      ))}
    </span>
  );
}
