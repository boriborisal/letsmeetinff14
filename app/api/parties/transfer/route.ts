// POST /api/parties/transfer
// Body: { partyId: string, uid: string }   ← uid는 새 공대장이 될 멤버
// Header: Authorization: Bearer <Firebase ID token>
//
// 흐름:
//   1. ID 토큰 검증 → callerUid
//   2. caller가 현재 leader인지 확인
//   3. 대상이 같은 공대 멤버인지 확인 (자기 자신 X)
//   4. atomic batch:
//      - parties/{partyId}.leaderUid = newUid
//      - parties/{partyId}/members/{newUid}.role = "leader"
//      - parties/{partyId}/members/{callerUid}.role = "member"

import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getUidFromRequest } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TransferBody {
  partyId?: string;
  uid?: string;
}

export async function POST(req: NextRequest) {
  const callerUid = await getUidFromRequest(req);
  if (!callerUid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TransferBody;
  try {
    body = (await req.json()) as TransferBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const partyId = body.partyId?.trim();
  const newLeaderUid = body.uid?.trim();
  if (!partyId || !newLeaderUid) {
    return NextResponse.json({ error: "partyId/uid 누락" }, { status: 400 });
  }
  if (newLeaderUid === callerUid) {
    return NextResponse.json(
      { error: "본인에게 양도할 수 없습니다." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const partyRef = db.doc(`parties/${partyId}`);
  const partySnap = await partyRef.get();
  if (!partySnap.exists) {
    return NextResponse.json({ error: "공대를 찾을 수 없습니다." }, { status: 404 });
  }
  const partyData = partySnap.data() as { leaderUid?: string };
  if (partyData.leaderUid !== callerUid) {
    return NextResponse.json({ error: "공대장만 양도할 수 있습니다." }, { status: 403 });
  }

  // 대상이 같은 공대 멤버인지
  const newLeaderMemberRef = db.doc(`parties/${partyId}/members/${newLeaderUid}`);
  const oldLeaderMemberRef = db.doc(`parties/${partyId}/members/${callerUid}`);
  const newSnap = await newLeaderMemberRef.get();
  if (!newSnap.exists) {
    return NextResponse.json(
      { error: "대상이 공대원이 아닙니다." },
      { status: 404 },
    );
  }

  const batch = db.batch();
  batch.update(partyRef, { leaderUid: newLeaderUid });
  batch.update(newLeaderMemberRef, { role: "leader" });
  batch.update(oldLeaderMemberRef, { role: "member" });
  await batch.commit();

  return NextResponse.json({ ok: true });
}
