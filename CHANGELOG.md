# CHANGELOG

Let's Meet in FF14의 주목할 만한 변경사항.
형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 변형 (한국어 섹션).

각 항목 prefix:
- **신규** (Added) — 새 기능
- **변경** (Changed) — 기존 동작 변경
- **수정** (Fixed) — 버그 수정
- **제거** (Removed) — 삭제된 기능

날짜는 한국 시간(KST) 기준.

---

## [Unreleased]

### 신규
- **공대장 강퇴 기능**: 공대원 모달에서 리더에게만 [강퇴] 버튼 노출 (본인/다른 리더 제외). 확인 다이얼로그 → 멤버 doc 삭제 + 사용자 partyIds에서 제거. `/api/parties/kick` (서버 라우트, leader 권한 검증).
- **공대 해체 (리더)**: 좌측 패널 하단에 [공대 해체] 버튼. 멤버·가능 시간·일정·출석·메모 모두 삭제 + 모든 사용자의 partyIds에서 제거 + 공대 doc 삭제. `/api/parties/disband` 단일 batch.
- **첫 프로필 설정 강제**: 가입/공대 생성 시 placeholder(Moogle/WAR/MT) 그대로 저장되던 문제 → `Member.profileSetup` 플래그 도입. 첫 진입 시 서버·메인 잡·메인 자리는 빈 상태로 시작, 사용자가 의식적으로 선택 후에만 저장 가능. 필수 필드엔 빨강 `*` 표시.
- **프로필 미설정 표시**: profileSetup=false인 공대원은 멤버 목록·내 프로필·상세 모달에서 "프로필 미설정"으로 노출 (placeholder인 모그리/전사/MT를 잘못 노출하지 않게).
- **자리 매칭 정확도**: profileSetup=false 멤버는 매칭에서 제외 (placeholder MT 등이 결과를 왜곡하지 않게). 추천 카드 위에 "프로필 미설정 N명 제외됨" 노란 안내 표시.

### 변경
- **편집 중 셀 툴팁 완전 비활성**: 모바일에서 hover가 입력에 끌려가 거슬려 시간 표시도 숨김. 잠금 상태(제출 후)에선 그대로 명단 노출.
- **input/textarea 내부 스크롤바·resize 핸들 숨김**: 입력 시 스크롤바가 살짝 노출되던 케이스 차단. body 스크롤바도 함께 숨김 처리.
- **공대원 모달 스크롤바 숨김**: 모달 내부가 길어 세로 스크롤이 생길 때 바를 보이지 않게 (no-scrollbar 클래스).

---

## 2026-04-29 — Phase 1 배포 후 개선

### 신규
- **공대원 상세 모달** — 좌측 패널에서 멤버 li 클릭 시 모달. 프로필(직업·자리·프프로그·자기소개) + 본인이 입력한 이번 주 가능 시간 그리드(read-only).
- **셀 hover 툴팁** — 시간 그리드 셀에 마우스 올리면 시간 + "가능 (N명): 캐릭A, 캐릭B, ..." 표시. CSS only (data-tooltip).
- **메인 자리 중복 방지** — 프로필 편집 시 다른 공대원이 이미 main으로 잡은 자리는 비활성. 체인지 가능 자리에는 제약 없음.
- **OAuth redirect 보존** — `/join?code=XXX` 같은 URL을 비로그인 상태에서 접속 → Discord 로그인 → 자동으로 원래 URL로 회귀. open redirect 방어 포함.
- **멤버 제출 상태 시각 표시** — 좌측 멤버 목록에서 이번 주 응답 완료자=초록 틴트(25%), 미응답=빨강 틴트(25%) + "일정 입력 전" 배지.
- **세션 1릴 개수 옵션** — 공대 만들기/수정 시 한 세션에 진행할 1릴 개수(1~4) 선택. 추천 카드/일정 확정 길이가 이 값 기준.
- **공대원 8명 정원 한도** — 9번째 가입 시도 시 서버에서 거부.
- **공대원 실시간 갱신** — 다른 사람 가입/탈퇴/프로필 변경이 본인 화면에 즉시 반영 (onSnapshot).
- **다크/라이트 테마 토글** — 헤더 우상단 ☀️/🌙. 다크 기본, 선택 localStorage 저장.

### 변경
- **이름**: FFTuning → Let's Meet in FF14
- **레이드 콘텐츠**: 모든 극만신 40개 추가 (신생~황금), 환만신 제거, 영식 이름 약칭화 ("아르카디아 헤비급 1식" → shortKor "헤비급 1층"), nameKor는 풀네임 유지
- **드롭다운 정렬**: 극만신 → 영식 → 절 (각 그룹 내 패치 내림차순)
- **공대 기본명 로직**: 극만신은 풀네임 fallback ("극 에누오 공대"), 토벌전 접미사 제거
- **모든 input placeholder 제거**

### 수정
- **시간 그리드 클릭 화면 갱신 안 되는 버그** — 제출 전 상태에서 selfSlots가 savedSlots(빈 값)를 가리키던 문제. editable 기준으로 draft/saved 분기.
- **다른 사람 가입이 즉시 반영 안 되던 문제** — listPartyMembers (1회 fetch) → subscribePartyMembers (onSnapshot)
- **Vercel 배포 ESLint 차단** — unused vars/imports 정리
- **Discord OAuth localhost redirect 문제** — 환경변수 + Vercel redeploy 필요 안내
- **잡 아이콘 매핑** — XIVAPI 잡 ID 6개 off-by-one 보정 (BLU 누락분)
- **Next.js 14.2.35 보안 패치 반영**

### 인프라
- **Firestore 룰**: 일반 멤버가 progressNote 단일 필드만 update 가능 (협업 메모용)
- **App Hosting → Vercel**: 배포 플랫폼 전환
- **GitHub repo private**: boriborisal/letsmeetinff14

---

## 2026-04-28 — Phase 1 MVP 첫 배포

### 신규 (초기 커밋)
- **인증**: Discord OAuth (Firebase Custom Token 방식). 로그인/로그아웃, users/{uid} 자동 생성.
- **공대 관리**: 생성 / 수정 / 탈퇴 / 초대 코드 / 8명까지 가입.
- **멤버 프로필**: 캐릭명, 서버(모그리/초코보/카벙클/톤베리/펜리르), 메인 잡 + 가능 잡, 메인 자리 + 체인지 가능 자리, 프프로그 URL, 자기소개.
- **가능 시간 입력 그리드**: when2meet 스타일, 30분 단위, 1릴 단위 wrap (셀 4/3/2개), 주 페이지네이션, 다른 공대원 응답 heatmap, 클릭/드래그 토글.
- **출발 가능 1릴 자동 추출**: 8자리 백트래킹 매칭, 연속 1릴 그룹화, 추천 카드 (가장 긴 그룹 + 주말 우선).
- **일정 확정 + 출석**: 공대장 확정, 멤버 출/결/미정 + 결석 사유 메모, 휴공 처리.
- **진도 메모**: 공대 페이지 자유 텍스트 (모든 멤버 편집).
- **레이드 시드**: 절 7 + 영식 60.
- **잡 아이콘**: XIVAPI 21개 다운로드, 롤 색 배경 위에 합성.

### 인프라
- Next.js 14 (App Router) + TypeScript + Tailwind
- Firebase (Firestore + Auth, asia-northeast3) + Discord OAuth
- Firestore 룰 + App Check 가이드
- Vercel 배포
