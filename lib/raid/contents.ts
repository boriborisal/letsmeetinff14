// 레이드 메타데이터 — 코드 레벨 수동 관리.
// 한섭 패치 후 PR로 항목 추가. 외부 fetch 절대 금지.
//
// 출처: ff14_레이드_정리.md (나무위키 기반).
// 한섭 패치 진행 시 위 MD 먼저 갱신 → 본 파일 동기화.
//
// 2026-04-28 기준 (한섭 7.5 출시일).
//   - 모든 절(7개) 도전 가능 — 절 요성난무(7.51)만 한섭 미정 → active=false
//   - 모든 영식(3.x ~ 7.x) 시드. 과거 영식도 정복·진척용으로 선택 가능.
//   - 24인 alliance · 토벌전 · 극만신 · 신생 영웅(2.x)은 시드 제외 (필요 시 추가).
//
// id 규칙: EN 커뮤니티 약어 (a1s, o5s, p9s, m4s 등).
//   - Alexander(3.x) = a1s..a12s, Omega(4.x) = o1s..o12s,
//     Eden(5.x) = e1s..e12s, Pandemonium(6.x) = p1s..p12s,
//     Arkadion(7.x) = m1s..m12s

import type { RaidContent } from "@/types";

export const RAID_CONTENTS: readonly RaidContent[] = [
  // ──────────────────────────────────────────────
  // 절(絶) 시리즈 (1릴 120분)
  // ──────────────────────────────────────────────
  { id: "ucob", nameKor: "절 바하무트 토벌전",     shortKor: "절바하",   tier: "ultimate", patch: "4.11", partySize: 8, releasedAtKor: "2018-04-17", active: true },
  { id: "uwu",  nameKor: "절 알테마 웨폰 파괴작전", shortKor: "절테마",   tier: "ultimate", patch: "4.31", partySize: 8, releasedAtKor: "2018-11-20", active: true },
  { id: "tea",  nameKor: "절 알렉산더 토벌전",     shortKor: "절렉산더",     tier: "ultimate", patch: "5.11", partySize: 8, releasedAtKor: "2020-04-14", active: true },
  { id: "dsr",  nameKor: "절 용시전쟁",           shortKor: "절용시",   tier: "ultimate", patch: "6.11", partySize: 8, releasedAtKor: "2022-10-25", active: true },
  { id: "top",  nameKor: "절 오메가 검증전",       shortKor: "절메가",   tier: "ultimate", patch: "6.31", partySize: 8, releasedAtKor: "2023-07-18", active: true },
  { id: "fru",  nameKor: "절 또 하나의 미래",       shortKor: "절에덴",   tier: "ultimate", patch: "7.11", partySize: 8, releasedAtKor: "2025-04-15", active: true },
  { id: "fkn",  nameKor: "절 요성난무",           shortKor: "절케프카", tier: "ultimate", patch: "7.51", partySize: 8, releasedAtKor: "2026-06-02", active: true },

  // ──────────────────────────────────────────────
  // 3.x 창천의 이슈가르드 — 기공성 알렉산더 영식
  // ──────────────────────────────────────────────
  // 기동편 (3.0)
  { id: "a1s",  nameKor: "기공성 알렉산더 기동편 1층 (영식)", shortKor: "기동 1층",  tier: "savage_1_3", patch: "3.05", partySize: 8, releasedAtKor: "2016-06-14", active: true },
  { id: "a2s",  nameKor: "기공성 알렉산더 기동편 2층 (영식)", shortKor: "기동 2층",  tier: "savage_1_3", patch: "3.05", partySize: 8, releasedAtKor: "2016-06-14", active: true },
  { id: "a3s",  nameKor: "기공성 알렉산더 기동편 3층 (영식)", shortKor: "기동 3층",  tier: "savage_1_3", patch: "3.05", partySize: 8, releasedAtKor: "2016-06-14", active: true },
  { id: "a4s",  nameKor: "기공성 알렉산더 기동편 4층 (영식)", shortKor: "기동 4층",  tier: "savage_4",   patch: "3.05", partySize: 8, releasedAtKor: "2016-06-14", active: true },
  // 율동편 (3.2)
  { id: "a5s",  nameKor: "기공성 알렉산더 율동편 1층 (영식)", shortKor: "율동 1층",  tier: "savage_1_3", patch: "3.21", partySize: 8, releasedAtKor: "2016-12-06", active: true },
  { id: "a6s",  nameKor: "기공성 알렉산더 율동편 2층 (영식)", shortKor: "율동 2층",  tier: "savage_1_3", patch: "3.21", partySize: 8, releasedAtKor: "2016-12-06", active: true },
  { id: "a7s",  nameKor: "기공성 알렉산더 율동편 3층 (영식)", shortKor: "율동 3층",  tier: "savage_1_3", patch: "3.21", partySize: 8, releasedAtKor: "2016-12-06", active: true },
  { id: "a8s",  nameKor: "기공성 알렉산더 율동편 4층 (영식)", shortKor: "율동 4층",  tier: "savage_4",   patch: "3.21", partySize: 8, releasedAtKor: "2016-12-06", active: true },
  // 천동편 (3.4)
  { id: "a9s",  nameKor: "기공성 알렉산더 천동편 1층 (영식)", shortKor: "천동 1층",  tier: "savage_1_3", patch: "3.41", partySize: 8, releasedAtKor: "2017-06-06", active: true },
  { id: "a10s", nameKor: "기공성 알렉산더 천동편 2층 (영식)", shortKor: "천동 2층", tier: "savage_1_3", patch: "3.41", partySize: 8, releasedAtKor: "2017-06-06", active: true },
  { id: "a11s", nameKor: "기공성 알렉산더 천동편 3층 (영식)", shortKor: "천동 3층", tier: "savage_1_3", patch: "3.41", partySize: 8, releasedAtKor: "2017-06-06", active: true },
  { id: "a12s", nameKor: "기공성 알렉산더 천동편 4층 (영식)", shortKor: "천동 4층", tier: "savage_4",   patch: "3.41", partySize: 8, releasedAtKor: "2017-06-06", active: true },

  // ──────────────────────────────────────────────
  // 4.x 홍련의 해방자 — 차원의 틈 오메가 영식
  // ──────────────────────────────────────────────
  // 델타편 (4.0)
  { id: "o1s",  nameKor: "차원의 틈 오메가 델타편 1층 (영식)",  shortKor: "델타 1층",  tier: "savage_1_3", patch: "4.01", partySize: 8, releasedAtKor: "2017-12-19", active: true },
  { id: "o2s",  nameKor: "차원의 틈 오메가 델타편 2층 (영식)",  shortKor: "델타 2층",  tier: "savage_1_3", patch: "4.01", partySize: 8, releasedAtKor: "2017-12-19", active: true },
  { id: "o3s",  nameKor: "차원의 틈 오메가 델타편 3층 (영식)",  shortKor: "델타 3층",  tier: "savage_1_3", patch: "4.01", partySize: 8, releasedAtKor: "2017-12-19", active: true },
  { id: "o4s",  nameKor: "차원의 틈 오메가 델타편 4층 (영식)",  shortKor: "델타 4층",  tier: "savage_4",   patch: "4.01", partySize: 8, releasedAtKor: "2017-12-19", active: true },
  // 시그마편 (4.2)
  { id: "o5s",  nameKor: "차원의 틈 오메가 시그마편 1층 (영식)", shortKor: "시그마 1층",  tier: "savage_1_3", patch: "4.21", partySize: 8, releasedAtKor: "2018-07-10", active: true },
  { id: "o6s",  nameKor: "차원의 틈 오메가 시그마편 2층 (영식)", shortKor: "시그마 2층",  tier: "savage_1_3", patch: "4.21", partySize: 8, releasedAtKor: "2018-07-10", active: true },
  { id: "o7s",  nameKor: "차원의 틈 오메가 시그마편 3층 (영식)", shortKor: "시그마 3층",  tier: "savage_1_3", patch: "4.21", partySize: 8, releasedAtKor: "2018-07-10", active: true },
  { id: "o8s",  nameKor: "차원의 틈 오메가 시그마편 4층 (영식)", shortKor: "시그마 4층",  tier: "savage_4",   patch: "4.21", partySize: 8, releasedAtKor: "2018-07-10", active: true },
  // 알파편 (4.4)
  { id: "o9s",  nameKor: "차원의 틈 오메가 알파편 1층 (영식)",  shortKor: "알파 1층",  tier: "savage_1_3", patch: "4.41", partySize: 8, releasedAtKor: "2019-02-26", active: true },
  { id: "o10s", nameKor: "차원의 틈 오메가 알파편 2층 (영식)",  shortKor: "알파 2층", tier: "savage_1_3", patch: "4.41", partySize: 8, releasedAtKor: "2019-02-26", active: true },
  { id: "o11s", nameKor: "차원의 틈 오메가 알파편 3층 (영식)",  shortKor: "알파 3층", tier: "savage_1_3", patch: "4.41", partySize: 8, releasedAtKor: "2019-02-26", active: true },
  { id: "o12s", nameKor: "차원의 틈 오메가 알파편 4층 (영식)",  shortKor: "알파 4층", tier: "savage_4",   patch: "4.41", partySize: 8, releasedAtKor: "2019-02-26", active: true },

  // ──────────────────────────────────────────────
  // 5.x 칠흑의 반역자 — 희망의 낙원 에덴 영식
  // ──────────────────────────────────────────────
  // 각성편 (5.0)
  { id: "e1s",  nameKor: "희망의 낙원 에덴 각성편 1층 (영식)", shortKor: "각성 1층",  tier: "savage_1_3", patch: "5.05", partySize: 8, releasedAtKor: "2019-12-03", active: true },
  { id: "e2s",  nameKor: "희망의 낙원 에덴 각성편 2층 (영식)", shortKor: "각성 2층",  tier: "savage_1_3", patch: "5.05", partySize: 8, releasedAtKor: "2019-12-03", active: true },
  { id: "e3s",  nameKor: "희망의 낙원 에덴 각성편 3층 (영식)", shortKor: "각성 3층",  tier: "savage_1_3", patch: "5.05", partySize: 8, releasedAtKor: "2019-12-03", active: true },
  { id: "e4s",  nameKor: "희망의 낙원 에덴 각성편 4층 (영식)", shortKor: "각성 4층",  tier: "savage_4",   patch: "5.05", partySize: 8, releasedAtKor: "2019-12-03", active: true },
  // 공명편 (5.2)
  { id: "e5s",  nameKor: "희망의 낙원 에덴 공명편 1층 (영식)", shortKor: "공명 1층",  tier: "savage_1_3", patch: "5.21", partySize: 8, releasedAtKor: "2020-09-01", active: true },
  { id: "e6s",  nameKor: "희망의 낙원 에덴 공명편 2층 (영식)", shortKor: "공명 2층",  tier: "savage_1_3", patch: "5.21", partySize: 8, releasedAtKor: "2020-09-01", active: true },
  { id: "e7s",  nameKor: "희망의 낙원 에덴 공명편 3층 (영식)", shortKor: "공명 3층",  tier: "savage_1_3", patch: "5.21", partySize: 8, releasedAtKor: "2020-09-01", active: true },
  { id: "e8s",  nameKor: "희망의 낙원 에덴 공명편 4층 (영식)", shortKor: "공명 4층",  tier: "savage_4",   patch: "5.21", partySize: 8, releasedAtKor: "2020-09-01", active: true },
  // 약속편/재생편 (5.4)
  { id: "e9s",  nameKor: "희망의 낙원 에덴 재생편 1층 (영식)", shortKor: "재생 1층",  tier: "savage_1_3", patch: "5.41", partySize: 8, releasedAtKor: "2021-05-18", active: true },
  { id: "e10s", nameKor: "희망의 낙원 에덴 재생편 2층 (영식)", shortKor: "재생 2층", tier: "savage_1_3", patch: "5.41", partySize: 8, releasedAtKor: "2021-05-18", active: true },
  { id: "e11s", nameKor: "희망의 낙원 에덴 재생편 3층 (영식)", shortKor: "재생 3층", tier: "savage_1_3", patch: "5.41", partySize: 8, releasedAtKor: "2021-05-18", active: true },
  { id: "e12s", nameKor: "희망의 낙원 에덴 재생편 4층 (영식)", shortKor: "재생 4층", tier: "savage_4",   patch: "5.41", partySize: 8, releasedAtKor: "2021-05-18", active: true },

  // ──────────────────────────────────────────────
  // 6.x 효월의 종언 — 마의 전당 판데모니움 영식
  // ──────────────────────────────────────────────
  // 변옥편 (6.0)
  { id: "p1s",  nameKor: "마의 전당 판데모니움 변옥편 1층 (영식)", shortKor: "변옥 1층",  tier: "savage_1_3", patch: "6.05", partySize: 8, releasedAtKor: "2022-05-31", active: true },
  { id: "p2s",  nameKor: "마의 전당 판데모니움 변옥편 2층 (영식)", shortKor: "변옥 2층",  tier: "savage_1_3", patch: "6.05", partySize: 8, releasedAtKor: "2022-05-31", active: true },
  { id: "p3s",  nameKor: "마의 전당 판데모니움 변옥편 3층 (영식)", shortKor: "변옥 3층",  tier: "savage_1_3", patch: "6.05", partySize: 8, releasedAtKor: "2022-05-31", active: true },
  { id: "p4s",  nameKor: "마의 전당 판데모니움 변옥편 4층 (영식)", shortKor: "변옥 4층",  tier: "savage_4",   patch: "6.05", partySize: 8, releasedAtKor: "2022-05-31", active: true },
  // 연옥편 (6.2)
  { id: "p5s",  nameKor: "마의 전당 판데모니움 연옥편 1층 (영식)", shortKor: "연옥 1층",  tier: "savage_1_3", patch: "6.21", partySize: 8, releasedAtKor: "2023-02-14", active: true },
  { id: "p6s",  nameKor: "마의 전당 판데모니움 연옥편 2층 (영식)", shortKor: "연옥 2층",  tier: "savage_1_3", patch: "6.21", partySize: 8, releasedAtKor: "2023-02-14", active: true },
  { id: "p7s",  nameKor: "마의 전당 판데모니움 연옥편 3층 (영식)", shortKor: "연옥 3층",  tier: "savage_1_3", patch: "6.21", partySize: 8, releasedAtKor: "2023-02-14", active: true },
  { id: "p8s",  nameKor: "마의 전당 판데모니움 연옥편 4층 (영식)", shortKor: "연옥 4층",  tier: "savage_4",   patch: "6.21", partySize: 8, releasedAtKor: "2023-02-14", active: true },
  // 천옥편 (6.4)
  { id: "p9s",  nameKor: "마의 전당 판데모니움 천옥편 1층 (영식)", shortKor: "천옥 1층",  tier: "savage_1_3", patch: "6.41", partySize: 8, releasedAtKor: "2023-10-31", active: true },
  { id: "p10s", nameKor: "마의 전당 판데모니움 천옥편 2층 (영식)", shortKor: "천옥 2층", tier: "savage_1_3", patch: "6.41", partySize: 8, releasedAtKor: "2023-10-31", active: true },
  { id: "p11s", nameKor: "마의 전당 판데모니움 천옥편 3층 (영식)", shortKor: "천옥 3층", tier: "savage_1_3", patch: "6.41", partySize: 8, releasedAtKor: "2023-10-31", active: true },
  { id: "p12s", nameKor: "마의 전당 판데모니움 천옥편 4층 (영식)", shortKor: "천옥 4층", tier: "savage_4",   patch: "6.41", partySize: 8, releasedAtKor: "2023-10-31", active: true },

  // ──────────────────────────────────────────────
  // 7.x 황금의 유산 — 아르카디아 선수권 영식
  // ──────────────────────────────────────────────
  // 라이트헤비급 (7.0)
  { id: "m1s",  nameKor: "아르카디아 라이트헤비급 1층 (영식)", shortKor: "라이트헤비급 1층",  tier: "savage_1_3", patch: "7.05", partySize: 8, releasedAtKor: "2025-01-14", active: true },
  { id: "m2s",  nameKor: "아르카디아 라이트헤비급 2층 (영식)", shortKor: "라이트헤비급 2층",  tier: "savage_1_3", patch: "7.05", partySize: 8, releasedAtKor: "2025-01-14", active: true },
  { id: "m3s",  nameKor: "아르카디아 라이트헤비급 3층 (영식)", shortKor: "라이트헤비급 3층",  tier: "savage_1_3", patch: "7.05", partySize: 8, releasedAtKor: "2025-01-14", active: true },
  { id: "m4s",  nameKor: "아르카디아 라이트헤비급 4층 (영식)", shortKor: "라이트헤비급 4층",  tier: "savage_4",   patch: "7.05", partySize: 8, releasedAtKor: "2025-01-14", active: true },
  // 크루저급 (7.2)
  { id: "m5s",  nameKor: "아르카디아 크루저급 1층 (영식)",     shortKor: "크루저급 1층",  tier: "savage_1_3", patch: "7.2",  partySize: 8, releasedAtKor: "2025-07-15", active: true },
  { id: "m6s",  nameKor: "아르카디아 크루저급 2층 (영식)",     shortKor: "크루저급 2층",  tier: "savage_1_3", patch: "7.2",  partySize: 8, releasedAtKor: "2025-07-15", active: true },
  { id: "m7s",  nameKor: "아르카디아 크루저급 3층 (영식)",     shortKor: "크루저급 3층",  tier: "savage_1_3", patch: "7.2",  partySize: 8, releasedAtKor: "2025-07-15", active: true },
  { id: "m8s",  nameKor: "아르카디아 크루저급 4층 (영식)",     shortKor: "크루저급 4층",  tier: "savage_4",   patch: "7.2",  partySize: 8, releasedAtKor: "2025-07-15", active: true },
  // 헤비급 (7.4) — 현재 도전 중
  { id: "m9s",  nameKor: "아르카디아 헤비급 1층 (영식)",       shortKor: "헤비급 1층",  tier: "savage_1_3", patch: "7.4",  partySize: 8, releasedAtKor: "2026-02-03", active: true },
  { id: "m10s", nameKor: "아르카디아 헤비급 2층 (영식)",       shortKor: "헤비급 2층", tier: "savage_1_3", patch: "7.4",  partySize: 8, releasedAtKor: "2026-02-03", active: true },
  { id: "m11s", nameKor: "아르카디아 헤비급 3층 (영식)",       shortKor: "헤비급 3층", tier: "savage_1_3", patch: "7.4",  partySize: 8, releasedAtKor: "2026-02-03", active: true },
  { id: "m12s", nameKor: "아르카디아 헤비급 4층 (영식)",       shortKor: "헤비급 4층", tier: "savage_4",   patch: "7.4",  partySize: 8, releasedAtKor: "2026-02-03", active: true },

  // ──────────────────────────────────────────────
  // 극만신 (1릴 60분, 8인 트라이얼) — 모든 확장팩 통합, 환만신은 제외
  // ──────────────────────────────────────────────
  // 신생 2.x
  { id: "ex_ifrit",            nameKor: "극 이프리트 토벌전",              tier: "extreme", patch: "2.1",  partySize: 8, active: true },
  { id: "ex_titan",            nameKor: "극 타이탄 토벌전",                tier: "extreme", patch: "2.1",  partySize: 8, active: true },
  { id: "ex_garuda",           nameKor: "극 가루다 토벌전",                tier: "extreme", patch: "2.1",  partySize: 8, active: true },
  { id: "ex_mog",              nameKor: "극 모그루 모그 XII세 토벌전",     tier: "extreme", patch: "2.2",  partySize: 8, active: true },
  { id: "ex_leviathan",        nameKor: "극 리바이어선 토벌전",            tier: "extreme", patch: "2.2",  partySize: 8, active: true },
  { id: "ex_ramuh",            nameKor: "극 라무 토벌전",                  tier: "extreme", patch: "2.3",  partySize: 8, active: true },
  { id: "ex_shiva",            nameKor: "극 시바 토벌전",                  tier: "extreme", patch: "2.4",  partySize: 8, active: true },
  // 창천 3.x
  { id: "ex_ravana",           nameKor: "극 라바나 토벌전",                tier: "extreme", patch: "3.0",  partySize: 8, active: true },
  { id: "ex_bismarck",         nameKor: "극 비스마르크 토벌전",            tier: "extreme", patch: "3.0",  partySize: 8, active: true },
  { id: "ex_knights",          nameKor: "극 나이츠 오브 라운드 토벌전",     tier: "extreme", patch: "3.1",  partySize: 8, active: true },
  { id: "ex_sephirot",         nameKor: "극 마신 세피로트 토벌전",         tier: "extreme", patch: "3.2",  partySize: 8, active: true },
  { id: "ex_sophia",           nameKor: "극 마신 소피아 토벌전",           tier: "extreme", patch: "3.4",  partySize: 8, active: true },
  { id: "ex_zurvan",           nameKor: "극 마신 주르반 토벌전",           tier: "extreme", patch: "3.5",  partySize: 8, active: true },
  // 홍련 4.x
  { id: "ex_susano",           nameKor: "극 수신 스사노오 토벌전",         tier: "extreme", patch: "4.0",  partySize: 8, active: true },
  { id: "ex_lakshmi",          nameKor: "극 라쿠샨 토벌전",                tier: "extreme", patch: "4.0",  partySize: 8, active: true },
  { id: "ex_byakko",           nameKor: "극 백호 토벌전",                  tier: "extreme", patch: "4.2",  partySize: 8, active: true },
  { id: "ex_tsukuyomi",        nameKor: "극 츠쿠요미 토벌전",              tier: "extreme", patch: "4.3",  partySize: 8, active: true },
  { id: "ex_seiton",           nameKor: "극 수호자 셰이톤 토벌전",         tier: "extreme", patch: "4.5",  partySize: 8, active: true },
  { id: "ex_seiryu",           nameKor: "극 청룡 토벌전",                  tier: "extreme", patch: "4.5",  partySize: 8, active: true },
  // 칠흑 5.x
  { id: "ex_unending_titan",   nameKor: "극 원초 타이탄 토벌전",           tier: "extreme", patch: "5.0",  partySize: 8, releasedAtKor: "2019-12-03", active: true },
  { id: "ex_unending_ifrit",   nameKor: "극 원초 이프리트 토벌전",         tier: "extreme", patch: "5.0",  partySize: 8, releasedAtKor: "2019-12-03", active: true },
  { id: "ex_unending_garuda",  nameKor: "극 원초 가루다 토벌전",           tier: "extreme", patch: "5.0",  partySize: 8, releasedAtKor: "2019-12-03", active: true },
  { id: "ex_warrior_of_light", nameKor: "극 빛의 전사 토벌전",             tier: "extreme", patch: "5.0",  partySize: 8, releasedAtKor: "2019-12-03", active: true },
  { id: "ex_hades",            nameKor: "극 하데스 토벌전",                tier: "extreme", patch: "5.1",  partySize: 8, releasedAtKor: "2020-03-24", active: true },
  { id: "ex_ruby",             nameKor: "극 루비 웨폰 토벌전",             tier: "extreme", patch: "5.2",  partySize: 8, releasedAtKor: "2020-09-01", active: true },
  { id: "ex_bozja",            nameKor: "극 보즈야 추억전",                tier: "extreme", patch: "5.25", partySize: 8, releasedAtKor: "2020-11-10", active: true },
  { id: "ex_emerald",          nameKor: "극 에메랄드 웨폰 토벌전",         tier: "extreme", patch: "5.4",  partySize: 8, releasedAtKor: "2021-05-18", active: true },
  { id: "ex_diamond",          nameKor: "극 다이아몬드 웨폰 토벌전",       tier: "extreme", patch: "5.5",  partySize: 8, releasedAtKor: "2021-09-14", active: true },
  // 효월 6.x
  { id: "ex_zodiark",          nameKor: "극 조디아크 토벌전",              tier: "extreme", patch: "6.0",  partySize: 8, releasedAtKor: "2022-05-10", active: true },
  { id: "ex_endsinger",        nameKor: "극 종극의 결전",                  tier: "extreme", patch: "6.1",  partySize: 8, releasedAtKor: "2022-10-04", active: true },
  { id: "ex_barbariccia",      nameKor: "극 바르바리차 토벌전",            tier: "extreme", patch: "6.2",  partySize: 8, releasedAtKor: "2023-02-14", active: true },
  { id: "ex_rubicante",        nameKor: "극 루비칸테 토벌전",              tier: "extreme", patch: "6.3",  partySize: 8, releasedAtKor: "2023-06-27", active: true },
  { id: "ex_golbez",           nameKor: "극 골베자 토벌전",                tier: "extreme", patch: "6.4",  partySize: 8, releasedAtKor: "2023-10-31", active: true },
  { id: "ex_zeromus",          nameKor: "극 제로무스 토벌전",              tier: "extreme", patch: "6.5",  partySize: 8, releasedAtKor: "2024-04-02", active: true },
  // 황금 7.x
  { id: "ex_vali",             nameKor: "극 발리가르만다 토벌전",          tier: "extreme", patch: "7.0",  partySize: 8, releasedAtKor: "2024-12-03", active: true },
  { id: "ex_eternal_queen",    nameKor: "극 이터널 퀸 토벌전",             tier: "extreme", patch: "7.1",  partySize: 8, releasedAtKor: "2025-03-18", active: true },
  { id: "ex_zelenia",          nameKor: "극 젤레니아 토벌전",              tier: "extreme", patch: "7.2",  partySize: 8, releasedAtKor: "2025-07-15", active: true },
  { id: "ex_eternal_dark",     nameKor: "극 영원의 어둠 토벌전",           tier: "extreme", patch: "7.3",  partySize: 8, releasedAtKor: "2025-10-28", active: true },
  { id: "ex_glasya",           nameKor: "극 글라시아 라볼라스 토벌전",     tier: "extreme", patch: "7.4",  partySize: 8, releasedAtKor: "2026-02-03", active: true },
  { id: "ex_enuo",             nameKor: "극 에누오 토벌전",                tier: "extreme", patch: "7.5",  partySize: 8, releasedAtKor: "2026-04-28", active: true },
];

export function getRaidContent(id: string): RaidContent | undefined {
  return RAID_CONTENTS.find((r) => r.id === id);
}

/**
 * 활성 레이드만 정렬해서 반환.
 *   그룹 순서: 극만신(extreme) → 영식(savage_*) → 절(ultimate)
 *   같은 그룹 내: 패치 내림차순 (현역 먼저)
 *   동일 패치 내: stable sort로 contents.ts 정의 순서 유지
 */
export function tierGroupOrder(r: RaidContent): number {
  if (r.tier === "extreme") return 0;
  if (r.tier === "ultimate") return 2;
  return 1; // savage_1_3 / savage_4 / normal_8 / alliance_24
}

export function activeRaidContents(): RaidContent[] {
  return [...RAID_CONTENTS]
    .filter((r) => r.active)
    .sort((a, b) => {
      const dg = tierGroupOrder(a) - tierGroupOrder(b);
      if (dg !== 0) return dg;
      return parseFloat(b.patch) - parseFloat(a.patch);
    });
}
