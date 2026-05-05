"use client";

// 공대장 권한 이양 — /api/parties/transfer 호출 래퍼.

import { getFirebaseAuth } from "@/lib/firebase/client";

export async function transferLeadership(input: {
  partyId: string;
  uid: string;
}): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/parties/transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `양도 실패 (${res.status})`);
  }
}
