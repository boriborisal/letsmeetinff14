// POST /api/parties/kick
// Body: { partyId: string, uid: string }   ← uid는 강퇴할 멤버
// Header: Authorization: Bearer <Firebase ID token>
//
// 흐름:
//   1. ID 토큰 검증 → callerUid
//   2. caller가 해당 공대 leader인지 확인 (parties/{partyId}.leaderUid)
//   3. self-kick 차단 (공대장이 본인을 강퇴 불가)
//   4. atomic batch:
//      - parties/{partyId}/members/{uid} 삭제
//      - users/{uid}.partyIds 에서 partyId 제거
//
// availabilities/attendances 데이터는 정리 안 함 — 룰이 비공대원 read 차단.

import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getUidFromRequest } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface KickBody {
  partyId?: string;
  uid?: string;
}

export async function POST(req: NextRequest) {
  const callerUid = await getUidFromRequest(req);
  if (!callerUid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: KickBody;
  try {
    body = (await req.json()) as KickBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const partyId = body.partyId?.trim();
  const targetUid = body.uid?.trim();
  if (!partyId || !targetUid) {
    return NextResponse.json({ error: "partyId/uid 누락" }, { status: 400 });
  }
  if (targetUid === callerUid) {
    return NextResponse.json(
      { error: "공대장은 본인을 강퇴할 수 없습니다." },
      { status: 400 },
    );
  }

  const db = getAdminDb();

  // 권한: 호출자가 리더인지
  const partyRef = db.doc(`parties/${partyId}`);
  const partySnap = await partyRef.get();
  if (!partySnap.exists) {
    return NextResponse.json({ error: "공대를 찾을 수 없습니다." }, { status: 404 });
  }
  const partyData = partySnap.data() as { leaderUid?: string };
  if (partyData.leaderUid !== callerUid) {
    return NextResponse.json({ error: "공대장만 강퇴할 수 있습니다." }, { status: 403 });
  }

  const memberRef = db.doc(`parties/${partyId}/members/${targetUid}`);
  const userRef = db.doc(`users/${targetUid}`);

  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) {
    return NextResponse.json({ error: "이미 공대원이 아닙니다." }, { status: 404 });
  }

  const batch = db.batch();
  batch.delete(memberRef);
  batch.update(userRef, { partyIds: FieldValue.arrayRemove(partyId) });
  await batch.commit();

  return NextResponse.json({ ok: true });
}
