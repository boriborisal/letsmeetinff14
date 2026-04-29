# UI.md

FFTuning UI 결정사항 모음. 시안 작업하면서 정착된 패턴들. Phase 1 구현 시 이 문서를 단일 진실 원천(single source of truth)으로 사용.

## 톤

- 한국어 UI, 미니멀
- 다크 모드 기본 (라이트도 자동 대응)
- shadcn/ui + Tailwind 베이스
- 반응형: PC와 모바일(380px) 양쪽 검증

## 색상 시스템

CSS 변수로만 색 사용. 하드코딩 hex 금지. `color-mix(in srgb, var(--...), transparent N%)` 패턴으로 농도 표현.

### 의미별 색

| 의미 | 변수 | 사용 위치 |
|---|---|---|
| 본인 응답 (INPUT 모드) | `var(--color-background-info)` | 시간 그리드 셀 .on |
| 다른 공대원 응답 (농도 1~7) | `var(--color-text-success)` + transparent | 시간 그리드 셀 .h1~.h7 |
| 통합 가능자 수 (RESULT, 농도 1~8) | `var(--color-text-success)` + transparent | 시간 그리드 셀 .h1~.h8 |
| 출발 가능 1릴 외곽선 | `var(--color-text-info)` | `.av-reel.ready` border |
| 주말 (토·일) 라벨 | `var(--color-text-danger)` | 컬럼 헤더 .we |
| 추천 박스 배경 | `var(--color-background-success)` | RESULT 모드 추천 카드 |

### 농도 ramp (heatmap)

```css
.s.h1 { background: color-mix(in srgb, var(--color-text-success), transparent 88%); }
.s.h2 { background: color-mix(in srgb, var(--color-text-success), transparent 78%); }
.s.h3 { background: color-mix(in srgb, var(--color-text-success), transparent 68%); }
.s.h4 { background: color-mix(in srgb, var(--color-text-success), transparent 58%); }
.s.h5 { background: color-mix(in srgb, var(--color-text-success), transparent 46%); }
.s.h6 { background: color-mix(in srgb, var(--color-text-success), transparent 34%); }
.s.h7 { background: color-mix(in srgb, var(--color-text-success), transparent 22%); }
.s.h8 { background: color-mix(in srgb, var(--color-text-success), transparent 8%); }
```

INPUT 모드는 .h1~.h7 사용 (다른 공대원 7명 max, 본인 별도 표시).
RESULT 모드는 .h1~.h8 사용 (본인 포함 8명 통합).

## 시간 그리드 (핵심 컴포넌트)

### 방향
- **가로축 = 날짜 7일** (월~일, 한 페이지에 한 주)
- **세로축 = 시간** (위 18시 → 아래 02시, 8시간 = 16개 30분 슬롯)

when2meet 스타일. 가로 방향으로 회전된 버전은 폐기.

### 셀 사이즈
- 슬롯: `height: 18px; border-radius: 2px;`
- 슬롯 간 세로 gap: 1px
- 컬럼 간 가로 gap: 3px
- 1릴 경계 (4슬롯마다): `margin-bottom: 4px`

### 컬럼 헤더
```
5/4
월
```
- 날짜: 12px, font-weight 500, primary color
- 요일: 11px, secondary color
- 토·일은 둘 다 danger color

### 1릴 wrapping (필수)
1릴 단위로 4슬롯을 묶는 wrapper div를 둠. 출발 가능 외곽선을 1릴 단위로 감싸기 위함.

```html
<div class="av-col">
  <div class="av-head">5/4 월</div>
  <div class="av-slots">
    <div class="av-reel">
      <div class="s"></div>
      <div class="s"></div>
      <div class="s"></div>
      <div class="s"></div>
    </div>
    <div class="av-reel ready">
      <div class="s h8"></div>
      <div class="s h8"></div>
      <div class="s h8"></div>
      <div class="s h8"></div>
    </div>
    ...
  </div>
</div>
```

```css
.av-reel {
  display: flex; flex-direction: column; gap: 1px;
  padding: 1px; border-radius: 3px;
  border: 1.5px solid transparent;
}
.av-reel.ready { border-color: var(--color-text-info); }
.av-slots { display: flex; flex-direction: column; gap: 4px; }
```

1릴 길이는 레이드별 고정 (절·영식4 = 4슬롯, 그 외 = 3슬롯). 사용자가 변경 불가.

### 시간축 라벨 (좌측)
- 1릴 경계마다 표시 (절 기준 2시간마다: 18시 / 20시 / 22시 / 00시)
- 1.5시간 1릴이면: 18시 / 19:30 / 21시 / 22:30 / 00시 / 01:30
- 10px, tertiary color
- 슬롯 첫 줄과 정확히 align

## 두 가지 모드

같은 그리드인데 색 처리가 다름.

### INPUT 모드 (본인 입력 중)
- 본인 응답 = 파랑 (`.on`), 우선 표시
- 다른 공대원 = 초록 농도 (`.h1` ~ `.h7`)
- 본인이 응답한 셀은 다른 공대원 정보 가려짐 (덮어쓰기). 정보 손실 OK — 결과는 RESULT 모드에서 통합되어 보임.
- 셀 클릭 토글로 본인 응답 입력
- 하단 액션: `이전` / `임시 저장` / `제출`

### RESULT 모드 (제출 후)
- 본인 응답이 다른 사람과 합쳐져 통합 농도 (`.h1` ~ `.h8`)
- 출발 가능 1릴 (8/8 가능) = `.av-reel.ready` 외곽선 강조
- 셀 read-only
- 상단에 추천 카드 + 일정 확정 버튼
- 하단 액션: `내 응답 수정` (INPUT 모드 재진입) / `일정 확정`

## 컨텍스트 바

상단 고정. 레이드/자리/1릴 정보 한 줄.

```
[레이드: 절 {} · 1릴 2시간 (자동)]
[자리·직업: {} · {} · 체인지 가능: D3 (리퍼)]
```

- 배경: `var(--color-background-secondary)`
- padding 12px 16px, border-radius md
- 라벨: 11px secondary
- 값: 13px medium
- 1릴 정보는 보조 텍스트로만. 토글 버튼 없음.

## 주 페이지네이션

```
[← 이전 주]   2026년 5월 4일 — 5월 10일   [다음 주 →]
```

- 그리드 위에 위치
- 좌우 버튼 13px, ghost 스타일
- 중앙 주 표시 13px, font-weight 500
- 한 페이지 = 7일 (월~일 고정)

## 범례

그리드 위 작은 라인.

```
■ 본인 가능   ▰▰▰▰ 다른 공대원 (1 → 7명)        간격 = 1릴 경계
```

INPUT/RESULT 모드에 따라 텍스트 살짝 다름.

## 추천 카드 (RESULT 모드만)

```
가장 추천하는 시간
목요일 5/7 20:00 — 24:00    (2릴 연속, 전원 가능)        [이 시간으로 일정 확정]
```

- 배경: `var(--color-background-success)`
- 텍스트: `var(--color-text-success)`
- 자동 추천 우선순위: 가장 긴 연속 출발 가능 1릴. 동률이면 주말 우선.

## 폰트 스케일

| 용도 | 크기 | weight | color |
|---|---|---|---|
| 페이지 제목 | 22px | 500 | primary |
| 설명 / 본문 | 13px | 400 | secondary 또는 primary |
| 컨텍스트 라벨 | 11px | 400 | secondary |
| 컨텍스트 값 | 13px | 500 | primary |
| 시간축 라벨 | 10px | 400 | tertiary |
| 컬럼 날짜 | 12px | 500 | primary |
| 컬럼 요일 | 11px | 400 | secondary |

## 모바일 (380px)

- 그리드 7컬럼 유지하되 슬롯 height 16px로 축소
- 컨텍스트 바 wrap (라벨 줄바꿈)
- 추천 카드 stack (시간 위 / 버튼 아래)
- 페이지네이션 버튼 padding 축소

## 컴포넌트 분리 (구현 시)

```
/components/availability
  AvailabilityGrid.tsx        # 전체 그리드 컨테이너 (mode prop으로 INPUT/RESULT 전환)
  ReelGroup.tsx               # 4슬롯 wrapper (ready 상태 외곽선 처리)
  AvailabilityCell.tsx        # 개별 30분 슬롯 (heatmap 클래스 매핑 포함)
  WeekNavigator.tsx           # 주 페이지네이션
  TimeAxis.tsx                # 좌측 시간 라벨 (1릴 경계 align)
  ContextBar.tsx              # 레이드·자리·1릴 정보
  RecommendationCard.tsx      # RESULT 모드 추천 박스
  Legend.tsx                  # 범례
```

각 컴포넌트는 server component 기본. 인터랙션 필요한 것 (Cell 토글, Grid mode 전환)만 `'use client'`.

## 안 하는 것 (의도적 제거)

- **1릴 길이 토글 UI**: 레이드별 자동 고정.
- **시간 그리드 가로 방향**: when2meet 세로 방향으로 통일.
- **회색 농도 heatmap**: 가독성 부족으로 폐기, 초록으로 통일.
- **본인 응답 위에 다른 공대원 카운트 동시 표시**: 정보 충돌 방지, 본인 응답 우선.
- **PWA / 푸시 알림 / 앱 셸**: 그냥 반응형 웹.
