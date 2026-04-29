"use client";

import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Schedule, SlotKey, User } from "@/types";

export interface CreateScheduleInput {
  partyId: string;
  reelStart: SlotKey;
  reelEnd: SlotKey;
  confirmedBy: User["uid"];
}

/** 공대장이 일정 확정. Firestore 룰: parties/{id}/schedules create는 leader만. */
export async function createSchedule(input: CreateScheduleInput): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, "parties", input.partyId, "schedules"), {
    partyId: input.partyId,
    reelStart: input.reelStart,
    reelEnd: input.reelEnd,
    confirmedBy: input.confirmedBy,
    confirmedAt: Date.now(),
  });
  return ref.id;
}

/** 일정 휴공 처리 (취소). 공대장만 가능 (Firestore 룰로 보호). */
export async function cancelSchedule(input: {
  partyId: string;
  scheduleId: Schedule["id"];
  reason?: string;
}): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(
    doc(db, "parties", input.partyId, "schedules", input.scheduleId),
    {
      cancelled: true,
      cancelReason: input.reason?.trim() || deleteField(),
    },
  );
}

/** 휴공 취소 (다시 활성화). */
export async function reactivateSchedule(input: {
  partyId: string;
  scheduleId: Schedule["id"];
}): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(
    doc(db, "parties", input.partyId, "schedules", input.scheduleId),
    {
      cancelled: deleteField(),
      cancelReason: deleteField(),
    },
  );
}

export async function listSchedules(partyId: string): Promise<Schedule[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "parties", partyId, "schedules"),
    orderBy("reelStart", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Schedule, "id">) }));
}
