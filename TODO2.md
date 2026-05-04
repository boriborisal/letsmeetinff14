# TODO2.md

배포 운영 단계에서의 follow-up 항목. TODO.md(전략 로드맵)와 별도로 **현재 운영 중 발견된 보안·기술 부채·QoL** 위주.

작업 시 [Unreleased]에 추가, 배포 시 CHANGELOG로 cut.

---

## 🔴 보안 — 우선

- [ ] **Firebase App Check 활성화**
  - Console → App Check → reCAPTCHA v3 site key 발급
  - 환경변수 `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` 설정
  - 클라이언트 init에 `initializeAppCheck` 한 줄
  - 효과: 비공식 클라이언트의 Firestore 직접 호출 차단
- [ ] **`npm audit` 처리**
  - 마지막 install 시 critical 1, high 4 경고
  - `npm audit` 돌려 critical/high 우선 fix
  - dependabot 또는 Vercel 자체 알림 활성화 검토
- [ ] **fflogsUrl URL 검증**
  - 저장 시 `^https?://` 패턴 강제 (XSS 방어)
  - 프로필 폼 onSubmit + Firestore 룰에서 동시 검증
- [ ] **계정 삭제 기능**
  - 헤더 우상단 계정 메뉴(현재 디스코드 프로필(이름 및 프로필사진)클릭시 계정 메뉴 뜨고 그안에 계정 삭제 있음)→ "계정 삭제"→ "계정을 정말 삭제하시겠어요?
소속된 모든 공대에서 자동으로 탈퇴되고,
입력한 가능 시간·출석 기록도 모두 사라져요.
이 동작은 되돌릴 수 없습니다."
  - 흐름: 모든 공대에서 강퇴 (= 멤버 doc 삭제 + partyIds 정리) → Firebase Auth user 삭제 → users/{uid} 삭제
  - PIPA 회원탈퇴권 보장
  - 새 서버 라우트 `/api/account/delete`

## 🟡 보안 — 중간

- [ ] **Rate limiting**
  - 특히 `/api/parties/join` (초대코드 brute force 방어)
  - Vercel Edge Config + KV 또는 Upstash Redis
  - IP당 분당 10회 권장
- [ ] **users/{uid} 읽기 권한 강화**
  - 현재: 로그인 사용자라면 누구나 read
  - 목표: 같은 공대 멤버에게만 read
  - 룰 작성 복잡 (collection group query 또는 클라이언트가 partyId 명시)
- [ ] **Cost 알림 설정**
  - Firebase: GCP Console → Billing → Budgets & Alerts → 월 임계치 (1만/3만 원)
  - Vercel: Usage alerts (Hobby 100GB-Hr/월 한도 모니터링)
- [ ] **시크릿 rotation (보수적)**
  - Firebase Admin private key
  - Discord client secret
  - AUTH_SECRET
  - 각각 새 발급 → Vercel env 갱신 → redeploy

## 🟢 보안 — 정착 후

- [ ] **Firestore 백업**
  - PITR 유료 — 대신 `gcloud firestore export` 주간 cron
  - 또는 GitHub Actions로 backup gist
- [ ] **공대 생성 수 제한**
  - 한 사람이 N개 이상 생성 시 차단 (예: 10개)
  - users/{uid}.partyIds 길이 체크 (서버 라우트)
- [ ] **프라이버시 정책 페이지**
  - 수집 항목: Discord ID/username/avatar, 캐릭명, 가능 시간, 출석
  - 보관 기간, 제3자 제공 (없음), 문의 연락처
- [ ] **로그 PII 점검**
  - `console.error`에 토큰/시크릿/PII 새지 않게 검토
  - Vercel 로그 보존 기간 확인

---

## 🛠 기술 부채

- [ ] **모바일 (380px) 검증 + 셀 사이즈 조정**
  - UI.md에 명세 있지만 실제 검증 안 함
  - 그리드 셀 height 18 → 16px (모바일), 폰트도 한 단계 다운
- [ ] **출석 멤버 상세**
  - 현재 일정에 "출 5 · 결 1 · 미정 2" 카운트만
  - 누가 결석/미정인지 펼쳐볼 수 있게
- [ ] **공대장 권한 이양**
  - 리더가 떠나면 공대 잠김 (현재는 해체만 가능)
  - 모달에 "공대장 양도" 버튼 추가
- [ ] **CRLF/LF 통일**
  - Windows에서 매 commit마다 CRLF 경고
  - `.gitattributes`에 `* text=auto eol=lf` 추가

---

## 📡 Phase 2 (CLAUDE.md 기준)

- [ ] **Discord Bot 알림 (별도 워커)**
  - 가능 시간 미응답 리마인더
  - 일정 확정/취소 알림
  - 일정 시작 N분 전 알림
- [ ] **대타 흐름 (라이트)**
  - 결석 발생 시 "대타 모집 중" 상태
  - 대타 정보 수동 입력 (서버/직업/프프로그)
- [ ] **분배 관리**
  - 토큰/장신구/무기 분배 차례
  - 분배 룰 메모
- [ ] **공유 자료**
  - 매크로 코드블록 + 한 클릭 복사
  - 진형도 이미지 업로드 + 핀
  - 참고 영상 링크
- [ ] **iCal 내보내기**
  - 확정 일정을 .ics로 다운로드 가능
- [ ] **정기 일정 자동 생성**
  - 매주 같은 시간 반복 옵션
- [ ] **공대원 출석률 통계**

---

## ✅ 처리 룰

- 작업 시작 시 체크박스 옆에 진행 상태 메모 (`[~]` = 진행 중 등)
- 완료 시 체크 + CHANGELOG `[Unreleased]`에 한 줄 추가
- 항목 자체가 더 이상 안 맞으면 삭제 — 화석화 방지
