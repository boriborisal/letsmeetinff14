"use client";

// 클라이언트에서 /api/parties/join을 호출하는 래퍼.
// 현재 사용자의 ID 토큰을 Authorization 헤더로 자동 첨부.

import { getFirebaseAuth } from "@/lib/firebase/client";

export interface JoinResult {
  partyId: string;
  alreadyMember: boolean;
}

export async function joinPartyByCode(input: { inviteCode: string; charName: string }): Promise<JoinResult> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/parties/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `가입 실패 (${res.status})`);
  }
  return (await res.json()) as JoinResult;
}
