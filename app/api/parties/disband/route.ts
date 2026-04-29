// POST /api/parties/disband
// Body: { partyId: string }
// Header: Authorization: Bearer <Firebase ID token>
//
// 공대장이 공대를 완전히 해체한다. 다음 데이터를 모두 정리:
//   - parties/{id}/schedules/{*}/attendances/{*}
//   - parties/{id}/schedules/{*}
//   - parties/{id}/availabilities/{*}
//   - parties/{id}/members/{*}
//   - users/{각 멤버 uid}.partyIds 에서 partyId 제거
//   - parties/{id} 자체
//
// MVP 데이터 볼륨 가정 (≤ 200 docs)으로 단일 batch (≤ 500 op) 사용.
// 향후 공대당 데이터 폭증 시 청크로 분할.

import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getUidFromRequest } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DisbandBody {
  partyId?: string;
}

export async function POST(req: NextRequest) {
  const callerUid = await getUidFromRequest(req);
  if (!callerUid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: DisbandBody;
  try {
    body = (await req.json()) as DisbandBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const partyId = body.partyId?.trim();
  if (!partyId) {
    return NextResponse.json({ error: "partyId 누락" }, { status: 400 });
  }

  const db = getAdminDb();
  const partyRef = db.doc(`parties/${partyId}`);
  const partySnap = await partyRef.get();
  if (!partySnap.exists) {
    return NextResponse.json({ error: "공대를 찾을 수 없습니다." }, { status: 404 });
  }
  const partyData = partySnap.data() as { leaderUid?: string };
  if (partyData.leaderUid !== callerUid) {
    return NextResponse.json({ error: "공대장만 해체할 수 있습니다." }, { status: 403 });
  }

  // 모든 하위 컬렉션 수집
  const [membersSnap, availSnap, schedulesSnap] = await Promise.all([
    db.collection(`parties/${partyId}/members`).get(),
    db.collection(`parties/${partyId}/availabilities`).get(),
    db.collection(`parties/${partyId}/schedules`).get(),
  ]);

  // schedules 각각의 attendances 수집
  const attendanceSnaps = await Promise.all(
    schedulesSnap.docs.map((s) =>
      db.collection(`parties/${partyId}/schedules/${s.id}/attendances`).get(),
    ),
  );

  const memberUids = membersSnap.docs.map((d) => d.id);

  const batch = db.batch();

  // attendances
  for (const snap of attendanceSnaps) {
    for (const att of snap.docs) batch.delete(att.ref);
  }
  // schedules
  for (const s of schedulesSnap.docs) batch.delete(s.ref);
  // availabilities
  for (const a of availSnap.docs) batch.delete(a.ref);
  // members
  for (const m of membersSnap.docs) batch.delete(m.ref);
  // users.partyIds 정리
  for (const uid of memberUids) {
    batch.update(db.doc(`users/${uid}`), {
      partyIds: FieldValue.arrayRemove(partyId),
    });
  }
  // 공대 doc 자체
  batch.delete(partyRef);

  await batch.commit();

  return NextResponse.json({ ok: true, deletedMembers: memberUids.length });
}
