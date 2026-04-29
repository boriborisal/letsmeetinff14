"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Availability, Party, User } from "@/types";

function availabilityDocId(uid: User["uid"], weekStart: string): string {
  return `${uid}_${weekStart}`;
}

export async function getMyAvailability(
  partyId: Party["id"],
  uid: User["uid"],
  weekStart: string,
): Promise<Availability | null> {
  const db = getFirebaseDb();
  const ref = doc(
    db,
    "parties",
    partyId,
    "availabilities",
    availabilityDocId(uid, weekStart),
  );
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Availability) : null;
}

/** 본인 가능 시간 저장. 임시저장은 submitted=false, 제출은 submitted=true. */
export async function saveMyAvailability(input: {
  partyId: Party["id"];
  uid: User["uid"];
  weekStart: string;
  available: string[]; // SlotKey[]
  submitted: boolean;
}): Promise<void> {
  const db = getFirebaseDb();
  const id = availabilityDocId(input.uid, input.weekStart);
  const data: Availability = {
    partyId: input.partyId,
    uid: input.uid,
    weekStart: input.weekStart,
    available: Array.from(new Set(input.available)).sort(),
    updatedAt: Date.now(),
    submitted: input.submitted,
  };
  await setDoc(doc(db, "parties", input.partyId, "availabilities", id), data);
}

/** 한 주 분 모든 공대원 응답. 본인 포함 — 본인은 호출자가 분리 처리. */
export async function listWeekAvailabilities(
  partyId: Party["id"],
  weekStart: string,
): Promise<Availability[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "parties", partyId, "availabilities"),
    where("weekStart", "==", weekStart),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Availability);
}
