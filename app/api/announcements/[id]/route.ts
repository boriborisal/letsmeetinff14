// PATCH /api/announcements/[id] — 공지사항 수정 (운영자만)
// DELETE /api/announcements/[id] — 공지사항 삭제 (운영자만)

import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getUidFromRequest } from "@/lib/auth/server";
import { isAdminUid } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UpdateBody {
  title?: string;
  body?: string;
  pinned?: boolean;
}

async function requireAdmin(req: NextRequest): Promise<string | NextResponse> {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUid(uid)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return uid;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const t = body.title.trim();
    if (!t) return NextResponse.json({ error: "제목 비어 있음" }, { status: 400 });
    if (t.length > 120) return NextResponse.json({ error: "제목이 너무 깁니다" }, { status: 400 });
    update.title = t;
  }
  if (body.body !== undefined) {
    const b = body.body.trim();
    if (!b) return NextResponse.json({ error: "본문 비어 있음" }, { status: 400 });
    if (b.length > 5000) return NextResponse.json({ error: "본문이 너무 깁니다" }, { status: 400 });
    update.body = b;
  }
  if (body.pinned !== undefined) {
    update.pinned = body.pinned ? true : FieldValue.delete();
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다" }, { status: 400 });
  }
  update.updatedAt = Date.now();

  const db = getAdminDb();
  const ref = db.doc(`announcements/${params.id}`);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "공지사항을 찾을 수 없습니다" }, { status: 404 });
  }
  await ref.update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;

  const db = getAdminDb();
  await db.doc(`announcements/${params.id}`).delete();
  return NextResponse.json({ ok: true });
}
