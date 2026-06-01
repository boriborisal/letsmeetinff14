// POST /api/announcements — 공지사항 생성 (운영자만)
// Header: Authorization: Bearer <Firebase ID token>
// Body: { title: string, body: string, pinned?: boolean }

import { NextResponse, type NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getUidFromRequest } from "@/lib/auth/server";
import { isAdminUid } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateBody {
  title?: string;
  body?: string;
  pinned?: boolean;
}

export async function POST(req: NextRequest) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUid(uid)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let parsed: CreateBody;
  try {
    parsed = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const title = parsed.title?.trim();
  const body = parsed.body?.trim();
  if (!title || !body) {
    return NextResponse.json({ error: "title/body 누락" }, { status: 400 });
  }
  if (title.length > 120) {
    return NextResponse.json({ error: "제목이 너무 깁니다 (120자 이내)" }, { status: 400 });
  }
  if (body.length > 5000) {
    return NextResponse.json({ error: "본문이 너무 깁니다 (5000자 이내)" }, { status: 400 });
  }

  // 작성자 표시명: Firebase Auth 프로필에서 가져옴 (Discord 닉네임이 들어 있음)
  let authorName = "운영자";
  try {
    const userRecord = await getAdminAuth().getUser(uid);
    authorName = userRecord.displayName ?? authorName;
  } catch {
    /* fallback */
  }

  const db = getAdminDb();
  const docData: Record<string, unknown> = {
    title,
    body,
    authorUid: uid,
    authorName,
    createdAt: Date.now(),
  };
  if (parsed.pinned) docData.pinned = true;

  const ref = await db.collection("announcements").add(docData);
  return NextResponse.json({ id: ref.id });
}
