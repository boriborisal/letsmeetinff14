"use client";

import { weekDays } from "@/lib/datetime/week";

interface Props {
  weekStart: string;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekNavigator({ weekStart, onPrev, onNext }: Props) {
  const days = weekDays(weekStart);
  const first = days[0]!;
  const last = days[6]!;
  const yyyy = weekStart.slice(0, 4);
  const range = `${yyyy}년 ${first.label} — ${last.label}`;

  return (
    <div className="flex items-center justify-between text-base">
      <button
        type="button"
        onClick={onPrev}
        className="rounded-md px-2 py-1 text-base text-muted-foreground transition hover:text-foreground"
      >
        ← 이전 주
      </button>
      <span className="font-medium">{range}</span>
      <button
        type="button"
        onClick={onNext}
        className="rounded-md px-2 py-1 text-base text-muted-foreground transition hover:text-foreground"
      >
        다음 주 →
      </button>
    </div>
  );
}
