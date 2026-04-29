"use client";

import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Attendance, AttendanceStatus, Schedule, User } from "@/types";

export async function getMyAttendance(
  partyId: string,
  scheduleId: Schedule["id"],
  uid: User["uid"],
): Promise<Attendance | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(
    doc(db, "parties", partyId, "schedules", scheduleId, "attendances", uid),
  );
  return snap.exists() ? (snap.data() as Attendance) : null;
}

export async function listAttendances(
  partyId: string,
  scheduleId: Schedule["id"],
): Promise<Attendance[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    collection(db, "parties", partyId, "schedules", scheduleId, "attendances"),
  );
  return snap.docs.map((d) => d.data() as Attendance);
}

/** 본인 출석 상태 set. status 변경하면서 reason도 같이 보낼 수 있음. */
export async function setMyAttendance(input: {
  partyId: string;
  scheduleId: Schedule["id"];
  uid: User["uid"];
  status: AttendanceStatus;
  reason?: string;
}): Promise<void> {
  const db = getFirebaseDb();
  const data: Record<string, unknown> = {
    scheduleId: input.scheduleId,
    uid: input.uid,
    status: input.status,
    updatedAt: Date.now(),
  };
  if (input.reason !== undefined) {
    data.reason = input.reason.trim() ? input.reason.trim() : deleteField();
  }
  await setDoc(
    doc(db, "parties", input.partyId, "schedules", input.scheduleId, "attendances", input.uid),
    data,
    { merge: true },
  );
}
