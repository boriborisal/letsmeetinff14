"use client";

// Firestore 공대 관련 클라이언트 헬퍼.
// 서버 액션 도입 전이라 모든 쓰기는 클라이언트 + Firestore Rules로 보호.

import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { generatePartyId, generateInviteCode } from "@/lib/utils/id";
import { getRaidContent } from "@/lib/raid/contents";
import type { Party, RaidContent, User } from "@/types";

export interface CreatePartyInput {
  name?: string;                 // 비우면 raid shortKor 기반으로 자동 생성
  raidContentId: RaidContent["id"];
  leader: { uid: User["uid"]; charName: string };
}

function defaultPartyName(raidContentId: string): string {
  const raid = getRaidContent(raidContentId);
  if (!raid) return "공대";
  // 절·영식은 shortKor 우선, 극은 풀네임 fallback. "토벌전" 접미사는 공대명에 군더더기라 제거.
  const label = (raid.shortKor ?? raid.nameKor).replace(/\s*토벌전\s*$/, "").trim();
  return `${label} 공대`;
}

/**
 * 공대 생성. 3개 문서 atomic write:
 *   1. parties/{partyId}
 *   2. parties/{partyId}/members/{leaderUid}  (role=leader)
 *   3. users/{leaderUid}.partyIds += [partyId]
 *
 * 보안 규칙:
 *   - parties create: leaderUid == request.auth.uid
 *   - members create: isSelf(uid)
 *   - users update: isSelf(uid)
 */
export async function createParty(input: CreatePartyInput): Promise<{ partyId: string; party: Party }> {
  const db = getFirebaseDb();
  const partyId = generatePartyId();
  const inviteCode = generateInviteCode();
  const now = Date.now();

  const party: Party = {
    id: partyId,
    name: input.name?.trim() || defaultPartyName(input.raidContentId),
    raidContentId: input.raidContentId,
    leaderUid: input.leader.uid,
    createdAt: now,
    inviteCode,
  };

  const partyRef = doc(db, "parties", partyId);
  const memberRef = doc(db, "parties", partyId, "members", input.leader.uid);
  const userRef = doc(db, "users", input.leader.uid);

  // 멤버 doc은 charName만 있는 placeholder. 나머지는 프로필 페이지에서 채움.
  const memberDoc = {
    partyId,
    uid: input.leader.uid,
    role: "leader" as const,
    charName: input.leader.charName,
    server: "Moogle" as const, // 임시 default — 프로필에서 변경
    mainJob: "WAR" as const,   // 임시 default
    subJobs: [],
    mainSlot: "MT" as const,   // 임시 default
    changeSlots: [],
    joinedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(partyRef, party);
  batch.set(memberRef, memberDoc);
  batch.set(userRef, { partyIds: arrayUnion(partyId) }, { merge: true });
  await batch.commit();

  return { partyId, party };
}

/**
 * 공대 정보 수정. 리더만 호출 가능 (Firestore 룰로 보호).
 * 호출자가 이미 trim/default 처리한 값을 보낸다고 가정.
 */
export async function updateParty(
  partyId: string,
  patch: { name?: string; raidContentId?: RaidContent["id"] },
): Promise<void> {
  const db = getFirebaseDb();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.raidContentId !== undefined) update.raidContentId = patch.raidContentId;
  if (Object.keys(update).length === 0) return;
  await updateDoc(doc(db, "parties", partyId), update);
}

export { defaultPartyName };

/**
 * 진도 메모 업데이트. 모든 공대원이 호출 가능 (Firestore 룰: progressNote 단일 필드만 허용).
 */
export async function updateProgressNote(partyId: string, note: string): Promise<void> {
  const db = getFirebaseDb();
  const trimmed = note.trim();
  await updateDoc(doc(db, "parties", partyId), {
    progressNote: trimmed ? trimmed : deleteField(),
  });
}

/**
 * 본인이 공대 탈퇴.
 *   - parties/{partyId}/members/{uid} 삭제
 *   - users/{uid}.partyIds 에서 제거
 *
 * 리더는 호출하면 안 됨 (호출 측에서 사전 차단).
 * 멤버 본인의 availabilities/attendances는 남겨둠 — 룰이 비공대원 read를 차단.
 */
export async function leaveParty(input: {
  partyId: string;
  uid: User["uid"];
}): Promise<void> {
  const db = getFirebaseDb();
  const memberRef = doc(db, "parties", input.partyId, "members", input.uid);
  const userRef = doc(db, "users", input.uid);
  const batch = writeBatch(db);
  batch.delete(memberRef);
  batch.update(userRef, { partyIds: arrayRemove(input.partyId) });
  await batch.commit();
}


export async function getParty(partyId: string): Promise<Party | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "parties", partyId));
  return snap.exists() ? (snap.data() as Party) : null;
}

/** 사용자의 partyIds 기반으로 모든 소속 공대 한 번에 fetch. */
export async function listMyParties(partyIds: string[]): Promise<Party[]> {
  if (partyIds.length === 0) return [];
  const db = getFirebaseDb();
  // Firestore in 쿼리는 최대 30개. 일반 공대원은 그 이하라 한 번에 처리.
  const q = query(
    collection(db, "parties"),
    where(documentId(), "in", partyIds.slice(0, 30)),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Party);
}
