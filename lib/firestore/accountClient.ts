"use client";

// 계정 삭제 — /api/account/delete 호출 후 Firebase Auth signOut 처리.

import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export async function deleteMyAccount(): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/account/delete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `계정 삭제 실패 (${res.status})`);
  }

  // 서버에서 Auth user가 삭제되면 클라이언트 세션도 더 이상 유효 X. signOut으로 정리.
  await signOut(auth).catch(() => { /* 이미 끊어졌으면 무시 */ });
}
