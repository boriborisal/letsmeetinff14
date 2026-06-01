// FF14 한섭 도메인 타입. 변수·키는 영문, 한국어 표시는 *Kor 필드로 분리.

// ─────────────────────────────────────────────
// 직업 / 롤
// ─────────────────────────────────────────────

export type Role = "tank" | "healer" | "melee" | "ranged" | "caster";

export type TankJob = "PLD" | "WAR" | "DRK" | "GNB";
export type HealerJob = "WHM" | "SCH" | "AST" | "SGE";
export type MeleeJob = "MNK" | "DRG" | "NIN" | "SAM" | "RPR" | "VPR";
export type RangedJob = "BRD" | "MCH" | "DNC";
export type CasterJob = "BLM" | "SMN" | "RDM" | "PCT";

export type Job = TankJob | HealerJob | MeleeJob | RangedJob | CasterJob;

// ─────────────────────────────────────────────
// 자리 (8인 슬롯)
// ─────────────────────────────────────────────
// MT/ST 탱커 2, MH/SH 힐러 2, D1~D4 딜러 4

export type TankSlot = "MT" | "ST";
export type HealerSlot = "MH" | "SH";
export type DpsSlot = "D1" | "D2" | "D3" | "D4";

export type Slot = TankSlot | HealerSlot | DpsSlot;

export const ALL_SLOTS: readonly Slot[] = [
  "MT",
  "ST",
  "MH",
  "SH",
  "D1",
  "D2",
  "D3",
  "D4",
] as const;

// ─────────────────────────────────────────────
// 한섭 서버 (단일 DC)
// ─────────────────────────────────────────────

export type Server = "Moogle" | "Chocobo" | "Carbuncle" | "Tonberry" | "Fenrir";

export const ALL_SERVERS: readonly Server[] = [
  "Moogle",
  "Chocobo",
  "Carbuncle",
  "Tonberry",
  "Fenrir",
] as const;

// ─────────────────────────────────────────────
// 레이드 컨텐츠
// ─────────────────────────────────────────────

export type RaidTier =
  | "ultimate"      // 절 시리즈 — 1릴 120분
  | "savage_4"      // 영식 4층 — 1릴 120분
  | "savage_1_3"    // 영식 1~3층 — 1릴 90분
  | "normal_8"      // 8인 일반 레이드 — 1릴 90분
  | "alliance_24"   // 24인 연합 레이드 — 1릴 90분
  | "extreme";      // 토벌전 / 극만신 — 1릴 60분

export interface RaidContent {
  id: string;            // ex) "fru", "m9s"
  nameKor: string;       // 표시용 한국어 ex) "절 오메가 검증전"
  shortKor?: string;     // 줄임 표기 ex) "절오", "M9S"
  tier: RaidTier;
  patch: string;         // ex) "7.11", "7.4"
  partySize: 8 | 24;     // MVP는 8인만 활성. 24인 alliance는 Phase 3에서 활성화.
  releasedAtKor?: string; // 한섭 출시일 "YYYY-MM-DD" — 없으면 미정.
  active: boolean;       // 현재 도전 가능 여부 (UI 노출 필터)
}

// ─────────────────────────────────────────────
// 1릴 (1 reel) — 레이드별 고정 시간
// ─────────────────────────────────────────────

export const FOOD_MIN = 30;        // 1음식 = 30분 (그리드 최소 단위)

export const REEL_MIN_BY_TIER: Record<RaidTier, number> = {
  ultimate: 120,
  savage_4: 120,
  savage_1_3: 90,
  normal_8: 90,
  alliance_24: 90,
  extreme: 60,
};

export function reelSlotsForTier(tier: RaidTier): number {
  return REEL_MIN_BY_TIER[tier] / FOOD_MIN; // 4 / 3 / 2
}

// ─────────────────────────────────────────────
// 사용자 / 멤버 / 공대
// ─────────────────────────────────────────────

export interface User {
  uid: string;                  // Firebase Auth uid
  discordId: string;
  discordUsername: string;
  discordAvatarUrl?: string | null;
  createdAt: number;            // unix ms
  partyIds?: string[];          // 소속 공대 id 목록 (denormalized — 홈에서 빠르게 조회용)
}

export type PartyRole = "leader" | "member";

// 일정 조율 방식.
//   timeGrid — 30분 슬롯 그리드로 시간대를 직접 입력 (기존 기본)
//   dayOnly  — 레이드 시간을 고정하고 요일만 입력. fixedStart~fixedEnd 윈도우.
export type ScheduleMode = "timeGrid" | "dayOnly";

export interface Party {
  id: string;
  name: string;
  raidContentId: RaidContent["id"];
  leaderUid: User["uid"];
  createdAt: number;
  inviteCode: string;
  progressNote?: string;        // 진도 메모 (자유 텍스트, 모든 멤버 편집 가능)
  reelsPerSession?: number;     // 한 세션에 진행할 1릴 개수 (1~4, default 1).
                                // 추천 카드/일정 확정 길이의 기준.
                                // dayOnly에선 고정 윈도우의 1릴 개수로 자동 설정.
  // 일정 조율 방식. 필드가 없으면 "timeGrid" (기존 공대 하위호환).
  scheduleMode?: ScheduleMode;
  fixedStart?: string;          // dayOnly 전용 "HH:mm" (KST). 예: "21:30"
  fixedEnd?: string;            // dayOnly 전용 "HH:mm". 종료 ≤ 시작이면 자정 넘김.
}

export interface Member {
  partyId: Party["id"];
  uid: User["uid"];
  role: PartyRole;
  charName: string;
  server: Server;
  mainJob: Job;
  subJobs: Job[];               // 가능 직업 (메인 외)
  mainSlot: Slot;               // 메인 자리 1개
  changeSlots: Slot[];          // 체인지 가능 자리 (무제한)
  fflogsUrl?: string;           // 프프로그 URL — 텍스트로만 저장
  bio?: string;                 // 한 줄 자기소개
  joinedAt: number;
  // 사용자가 한 번이라도 프로필을 직접 저장했는지. 가입/생성 시엔 false (또는 미정).
  // false면 profile 페이지에서 server/mainJob/mainSlot을 빈 상태로 시작 → 강제 선택.
  // 기존 데이터(필드 자체 없음)는 true로 간주 (과거 사용자에 영향 X).
  profileSetup?: boolean;
}

// ─────────────────────────────────────────────
// 가능 시간 (Availability)
// ─────────────────────────────────────────────

// 시간 슬롯 키: "YYYY-MM-DDTHH:mm" (KST 기준, 30분 단위)
// ex) "2026-04-28T20:00", "2026-04-28T20:30"
export type SlotKey = string;

export interface Availability {
  partyId: Party["id"];
  uid: User["uid"];
  weekStart: string;            // "YYYY-MM-DD" 월요일
  available: SlotKey[];         // 본인이 가능한 30분 슬롯들
  updatedAt: number;
  submitted: boolean;           // 임시저장 vs 제출
}

// ─────────────────────────────────────────────
// 매칭 / 결과
// ─────────────────────────────────────────────

// 1릴 = 연속된 reelSlots 개의 30분 슬롯
export interface ReelWindow {
  startKey: SlotKey;            // 1릴 시작 30분 슬롯
  slotKeys: SlotKey[];          // 길이 = reelSlotsForTier(tier)
}

// 자리 매칭 결과 (출발 가능 = canDepart true)
export type SlotAssignment = Partial<Record<Slot, User["uid"]>>;

export interface ReelFeasibility {
  reel: ReelWindow;
  canDepart: boolean;
  assignment?: SlotAssignment;  // canDepart=true일 때 채움
  availableUids: User["uid"][]; // 1릴 전체에 응답한 멤버들
}

// ─────────────────────────────────────────────
// 일정 확정 / 출석
// ─────────────────────────────────────────────

export interface Schedule {
  id: string;
  partyId: Party["id"];
  reelStart: SlotKey;
  reelEnd: SlotKey;             // 마지막 30분 슬롯의 끝(=다음 슬롯 시작)
  confirmedBy: User["uid"];     // 공대장 uid
  confirmedAt: number;
  cancelled?: boolean;
  cancelReason?: string;
}

export type AttendanceStatus = "going" | "absent" | "tentative";

export interface Attendance {
  scheduleId: Schedule["id"];
  uid: User["uid"];
  status: AttendanceStatus;
  reason?: string;              // 결석 사유 메모
  updatedAt: number;
}

// ─────────────────────────────────────────────
// 직업 ↔ 자리 / 롤 분류 helper
// ─────────────────────────────────────────────

export const JOB_ROLE: Record<Job, Role> = {
  PLD: "tank", WAR: "tank", DRK: "tank", GNB: "tank",
  WHM: "healer", SCH: "healer", AST: "healer", SGE: "healer",
  MNK: "melee", DRG: "melee", NIN: "melee", SAM: "melee", RPR: "melee", VPR: "melee",
  BRD: "ranged", MCH: "ranged", DNC: "ranged",
  BLM: "caster", SMN: "caster", RDM: "caster", PCT: "caster",
};

export const SLOT_ROLE: Record<Slot, Role | "dps"> = {
  MT: "tank", ST: "tank",
  MH: "healer", SH: "healer",
  D1: "dps", D2: "dps", D3: "dps", D4: "dps",
};

// MH = Pure Healer (백마/점성), SH = Shield Healer (학자/현자)
export const HEALER_SLOT_JOBS: Record<HealerSlot, HealerJob[]> = {
  MH: ["WHM", "AST"],
  SH: ["SCH", "SGE"],
};

// ─────────────────────────────────────────────
// 표시용 한국어 라벨
// ─────────────────────────────────────────────

export const ROLE_KOR: Record<Role, string> = {
  tank: "탱커",
  healer: "힐러",
  melee: "근접딜",
  ranged: "원거리물리딜",
  caster: "캐스터",
};

export const JOB_KOR: Record<Job, string> = {
  PLD: "나이트", WAR: "전사", DRK: "암흑기사", GNB: "건브레이커",
  WHM: "백마도사", SCH: "학자", AST: "점성술사", SGE: "현자",
  MNK: "몽크", DRG: "용기사", NIN: "닌자", SAM: "사무라이", RPR: "리퍼", VPR: "바이퍼",
  BRD: "음유시인", MCH: "기공사", DNC: "무도가",
  BLM: "흑마도사", SMN: "소환사", RDM: "적마도사", PCT: "픽토맨서",
};

// 직업별 시각 표식 색 — FFXIV 커뮤니티 잡 컬러 대략 매칭
export const JOB_COLOR: Record<Job, string> = {
  PLD: "#a8d2eb", WAR: "#cf2621", DRK: "#d126cc", GNB: "#796d44",
  WHM: "#fff0dc", SCH: "#8657bc", AST: "#ffe74a", SGE: "#80a0f0",
  MNK: "#d69c00", DRG: "#4164cd", NIN: "#af1964", SAM: "#e46d04", RPR: "#965a90", VPR: "#108210",
  BRD: "#91ba5e", MCH: "#6ee1d6", DNC: "#e2b0af",
  BLM: "#a579d6", SMN: "#2d9b78", RDM: "#e87b7b", PCT: "#fc92e1",
};

export const JOBS_BY_ROLE: Record<Role, Job[]> = {
  tank: ["PLD", "WAR", "DRK", "GNB"],
  healer: ["WHM", "SCH", "AST", "SGE"],
  melee: ["MNK", "DRG", "NIN", "SAM", "RPR", "VPR"],
  ranged: ["BRD", "MCH", "DNC"],
  caster: ["BLM", "SMN", "RDM", "PCT"],
};

export const ROLE_ORDER: readonly Role[] = ["tank", "healer", "melee", "ranged", "caster"] as const;

export const SERVER_KOR: Record<Server, string> = {
  Moogle: "모그리",
  Chocobo: "초코보",
  Carbuncle: "카벙클",
  Tonberry: "톤베리",
  Fenrir: "펜리르",
};

export const SLOT_DESC: Record<Slot, string> = {
  MT: "메인 탱커",
  ST: "서브 탱커",
  MH: "메인 힐러 (백마/점성)",
  SH: "서브 힐러 (학자/현자)",
  D1: "딜러 1",
  D2: "딜러 2",
  D3: "딜러 3",
  D4: "딜러 4",
};

// ─────────────────────────────────────────────
// 사이트 공지사항 / 버그리포트 (사이트 전역, 공대 무관)
// ─────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  body: string;                 // 일반 텍스트 (줄바꿈 보존)
  authorUid: User["uid"];
  authorName: string;           // 운영자 표시명 (작성 시점 snapshot)
  createdAt: number;
  updatedAt?: number;
  pinned?: boolean;             // 상단 고정. 정렬: pinned desc, createdAt desc
}

export type BugReportStatus = "open" | "in_progress" | "resolved";

export interface BugReportReply {
  body: string;
  repliedByUid: User["uid"];    // 운영자 uid
  repliedByName: string;
  repliedAt: number;
}

export interface BugReport {
  id: string;
  title: string;
  body: string;
  authorUid: User["uid"];
  authorName: string;
  createdAt: number;
  updatedAt?: number;
  status: BugReportStatus;
  reply?: BugReportReply;       // 운영자 답변 (선택)
}

export const BUG_STATUS_KOR: Record<BugReportStatus, string> = {
  open: "접수",
  in_progress: "확인 중",
  resolved: "해결",
};
