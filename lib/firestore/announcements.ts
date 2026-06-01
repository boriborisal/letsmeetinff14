"use client";

// 공지사항(announcements) 클라이언트 헬퍼.
// 읽기는 비로그인 포함 누구나 가능 (Firestore Rules로 허용).
// 쓰기는 모두 /api/announcements를 거친다 (운영자 ADMIN_UIDS 화이트리스트 확인).

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Announcement } from "@/types";

/** 정렬 키: pinned desc → createdAt desc */
function sortAnnouncements(list: Announcement[]): Announcement[] {
  return [...list].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return b.createdAt - a.createdAt;
  });
}

export async function listAnnouncements(maxCount?: number): Promise<Announcement[]> {
  const db = getFirebaseDb();
  // pinned 필드가 없는 문서가 섞여 있어도 createdAt 정렬만으로 들고 와서 클라에서 재정렬.
  const q = maxCount
    ? query(collection(db, "announcements"), orderBy("createdAt", "desc"), fsLimit(maxCount * 2))
    : query(collection(db, "announcements"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, "id">) }));
  const sorted = sortAnnouncements(list);
  return maxCount ? sorted.slice(0, maxCount) : sorted;
}

export function subscribeAnnouncements(
  cb: (list: Announcement[]) => void,
  maxCount?: number,
): () => void {
  const db = getFirebaseDb();
  const q = maxCount
    ? query(collection(db, "announcements"), orderBy("createdAt", "desc"), fsLimit(maxCount * 2))
    : query(collection(db, "announcements"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, "id">) }));
    const sorted = sortAnnouncements(list);
    cb(maxCount ? sorted.slice(0, maxCount) : sorted);
  });
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "announcements", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Announcement, "id">) };
}
