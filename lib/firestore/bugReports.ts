"use client";

// 버그리포트 클라이언트 헬퍼.
// 읽기·작성·본인 글 삭제는 클라이언트에서 직접 (Firestore Rules로 보호).
// 상태 변경/운영자 답변/타인 글 삭제는 /api/bugs/[id] 경유.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth } from "@/lib/firebase/client";
import type { BugReport, BugReportStatus } from "@/types";

export interface CreateBugReportInput {
  title: string;
  body: string;
  authorName: string;
}

export async function createBugReport(input: CreateBugReportInput): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, "bugReports"), {
    title: input.title.trim(),
    body: input.body.trim(),
    authorUid: user.uid,
    authorName: input.authorName,
    createdAt: Date.now(),
    status: "open" as BugReportStatus,
  });
  return ref.id;
}

export async function listBugReports(): Promise<BugReport[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, "bugReports"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BugReport, "id">) }));
}

export function subscribeBugReports(cb: (list: BugReport[]) => void): () => void {
  const db = getFirebaseDb();
  const q = query(collection(db, "bugReports"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BugReport, "id">) })));
  });
}

export async function getBugReport(id: string): Promise<BugReport | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "bugReports", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<BugReport, "id">) };
}

/** 본인이 작성한 글 수정. title/body만 허용. (Firestore Rules로 보호) */
export async function updateMyBugReport(
  id: string,
  patch: { title?: string; body?: string },
): Promise<void> {
  const db = getFirebaseDb();
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.body !== undefined) update.body = patch.body.trim();
  if (Object.keys(update).length === 0) return;
  update.updatedAt = Date.now();
  await updateDoc(doc(db, "bugReports", id), update);
}

/** 본인이 작성한 글 삭제. 운영자가 타인 글 삭제는 /api/bugs/[id] DELETE 사용. */
export async function deleteMyBugReport(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, "bugReports", id));
}

/** 운영자: 상태 변경 + 답변 작성 (/api/bugs/[id] PATCH). */
export async function updateBugReportAsAdmin(
  id: string,
  patch: { status?: BugReportStatus; replyBody?: string | null },
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/bugs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `수정 실패 (${res.status})`);
  }
}

/** 운영자: 타인 글 삭제. */
export async function deleteBugReportAsAdmin(id: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/bugs/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `삭제 실패 (${res.status})`);
  }
}
