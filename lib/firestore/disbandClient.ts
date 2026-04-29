"use client";

// 공대 해체 (리더만). /api/parties/disband 호출 래퍼.

import { getFirebaseAuth } from "@/lib/firebase/client";

export async function disbandParty(input: { partyId: string }): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/parties/disband", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `해체 실패 (${res.status})`);
  }
}
