"use client";

// 공대원 강퇴 (리더만). /api/parties/kick 호출 래퍼.

import { getFirebaseAuth } from "@/lib/firebase/client";

export async function kickMember(input: { partyId: string; uid: string }): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/parties/kick", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `강퇴 실패 (${res.status})`);
  }
}
