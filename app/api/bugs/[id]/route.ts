// PATCH /api/bugs/[id] — 상태 변경 + 운영자 답변 (운영자만)
// DELETE /api/bugs/[id] — 타인 글 삭제 (운영자만). 본인 글 삭제는 클라이언트 직접.
//
// Body (PATCH): { status?: "open"|"in_progress"|"resolved", replyBody?: string|null }
//   replyBody === null → 답변 제거
//   replyBody === "" → 무시 (변경 없음)
//   replyBody === "텍스트" → 답변 세팅/갱신

import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getUidFromRequest } from "@/lib/auth/server";
import { isAdminUid } from "@/lib/auth/admin";
import type { BugReportStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS: ReadonlySet<BugReportStatus> = new Set(["open", "in_progress", "resolved"]);

interface PatchBody {
  status?: BugReportStatus;
  replyBody?: string | null;
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
  const uid = check;

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!VALID_STATUS.has(body.status)) {
      return NextResponse.json({ error: "잘못된 상태값" }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.replyBody !== undefined) {
    if (body.replyBody === null) {
      update.reply = FieldValue.delete();
    } else {
      const trimmed = body.replyBody.trim();
      if (trimmed) {
        if (trimmed.length > 5000) {
          return NextResponse.json({ error: "답변이 너무 깁니다" }, { status: 400 });
        }
        let repliedByName = "운영자";
        try {
          const u = await getAdminAuth().getUser(uid);
          repliedByName = u.displayName ?? repliedByName;
        } catch {
          /* fallback */
        }
        update.reply = {
          body: trimmed,
          repliedByUid: uid,
          repliedByName,
          repliedAt: Date.now(),
        };
      }
    }
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다" }, { status: 400 });
  }
  update.updatedAt = Date.now();

  const db = getAdminDb();
  const ref = db.doc(`bugReports/${params.id}`);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다" }, { status: 404 });
  }
  await ref.update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;
  const db = getAdminDb();
  await db.doc(`bugReports/${params.id}`).delete();
  return NextResponse.json({ ok: true });
}
