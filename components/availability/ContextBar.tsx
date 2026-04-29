"use client";

// 상단 컨텍스트 바 — 레이드·1릴·자리 정보 한 줄.

import { JOB_KOR, type Member, type RaidContent } from "@/types";
import { REEL_MIN_BY_TIER } from "@/types";

interface Props {
  raid: RaidContent;
  myMember: Member;
}

export function ContextBar({ raid, myMember }: Props) {
  const reelMin = REEL_MIN_BY_TIER[raid.tier];
  const reelHr = reelMin / 60;
  const reelLabel = reelHr === Math.floor(reelHr) ? `${reelHr}시간` : `${reelHr.toFixed(1)}시간`;
  const slots = [myMember.mainSlot, ...myMember.changeSlots];

  return (
    <div className="space-y-1 rounded-md bg-secondary px-4 py-3 text-base">
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] text-muted-foreground">레이드</span>
        <span className="text-[15px] font-medium">{raid.nameKor}</span>
        <span className="text-[13px] text-muted-foreground">
          · 1릴 {reelLabel} (자동)
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] text-muted-foreground">자리·직업</span>
        <span className="text-[15px] font-medium">
          {myMember.mainSlot} · {JOB_KOR[myMember.mainJob]}
        </span>
        {myMember.changeSlots.length > 0 ? (
          <span className="text-[13px] text-muted-foreground">
            · 체인지 가능: {myMember.changeSlots.join(", ")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
