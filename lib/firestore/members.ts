"use client";

import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Member, Party, User } from "@/types";

export async function getMember(
  partyId: Party["id"],
  uid: User["uid"],
): Promise<Member | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "parties", partyId, "members", uid));
  return snap.exists() ? (snap.data() as Member) : null;
}

export async function listPartyMembers(partyId: Party["id"]): Promise<Member[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "parties", partyId, "members"),
    orderBy("joinedAt", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Member);
}

/**
 * 멤버 목록 실시간 구독. 다른 사람이 가입/탈퇴/프로필 변경 시 자동 업데이트.
 * 반환된 unsubscribe를 cleanup에서 호출.
 */
export function subscribePartyMembers(
  partyId: Party["id"],
  cb: (members: Member[]) => void,
): () => void {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "parties", partyId, "members"),
    orderBy("joinedAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Member));
  });
}

/**
 * 본인 프로필 업데이트. role은 변경 불가 (rule + 클라이언트 양쪽에서 차단).
 * fflogsUrl/bio는 빈 문자열이면 undefined로 보내서 필드를 비움.
 */
export type MemberProfilePatch = Partial<
  Pick<
    Member,
    | "charName"
    | "server"
    | "mainJob"
    | "subJobs"
    | "mainSlot"
    | "changeSlots"
    | "fflogsUrl"
    | "bio"
  >
>;

export async function updateMyMemberProfile(
  partyId: Party["id"],
  uid: User["uid"],
  patch: MemberProfilePatch,
): Promise<void> {
  const db = getFirebaseDb();
  // Firestore Web SDK는 undefined 값을 거부 — undefined는 필드 삭제(deleteField)로 변환.
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    update[k] = v === undefined ? deleteField() : v;
  }
  if (Object.keys(update).length === 0) return;
  // 사용자가 의식적으로 저장 → profileSetup=true (이후 프로필 화면에서 빈 상태로 시작 안 함)
  update.profileSetup = true;
  await updateDoc(doc(db, "parties", partyId, "members", uid), update);
}
