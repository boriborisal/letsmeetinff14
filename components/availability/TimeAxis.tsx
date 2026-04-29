// 좌측 시간 축. 1릴 경계마다 라벨, 슬롯 첫 줄과 align.

interface Props {
  hourLabels: { atIndex: number; label: string }[];
  reelLen: number;
  reelCount: number;
}

export function TimeAxis({ hourLabels, reelLen, reelCount }: Props) {
  // 라벨은 reelCount + 1개 (마지막 라벨은 윈도우 종료 시각)
  // 1릴 경계마다 라벨 = 한 reel 안에서는 라벨 1개만, 그 reel 시작 위치에 위치.
  return (
    <div className="av-axis">
      {Array.from({ length: reelCount + 1 }, (_, r) => {
        const label = hourLabels[r]?.label ?? "";
        // 마지막 라벨은 윈도우 종료 — 윗 reel의 끝에 붙어있어야 하므로 음수 마진
        const isEnd = r === reelCount;
        return (
          <div
            key={r}
            className="av-axis-label"
            style={{
              height: isEnd
                ? "0px"
                : `${reelLen * 18 + (reelLen - 1) * 1 + 2 + 4}px`,
              // reelLen 셀 × 18px + (reelLen-1) gap × 1px + reel padding 2px(1px*2) + reel 간 gap 4px
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
