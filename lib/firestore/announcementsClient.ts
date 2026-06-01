"use client";

// /api/announcements 호출 래퍼. 운영자만 사용.

import { getFirebaseAuth } from "@/lib/firebase/client";

async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const idToken = await user.getIdToken();
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  pinned?: boolean;
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<{ id: string }> {
  const res = await authedFetch("/api/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `생성 실패 (${res.status})`);
  }
  return (await res.json()) as { id: string };
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  pinned?: boolean;
}

export async function updateAnnouncement(id: string, patch: UpdateAnnouncementInput): Promise<void> {
  const res = await authedFetch(`/api/announcements/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `수정 실패 (${res.status})`);
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const res = await authedFetch(`/api/announcements/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `삭제 실패 (${res.status})`);
  }
}
