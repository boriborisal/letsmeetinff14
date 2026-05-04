// POST /api/account/delete
// Header: Authorization: Bearer <Firebase ID token>
//
// PIPA 회원탈퇴권 보장 — 사용자가 자기 계정을 완전 삭제.
//
// 흐름:
//   1. ID 토큰 검증 → callerUid
//   2. users/{callerUid}.partyIds 의 각 partyId에 대해:
//      - leader면 cascade disband (모든 멤버/스케줄/출석/가능시간 삭제 + 모든 멤버 partyIds 정리)
//      - 일반 멤버면 self-kick (멤버 doc 삭제 + 본인 partyIds에서 제거)
//   3. users/{callerUid} 삭제
//   4. Firebase Auth user 삭제
//
// MVP — 사용자당 공대 N(≤10)개 가정. 각 공대 단위로 단일 batch 사용.

import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getUidFromRequest } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const callerUid = await getUidFromRequest(req);
  if (!callerUid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const userRef = db.doc(`users/${callerUid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    // 데이터는 없지만 Auth user는 살아있을 수 있음 — 그것만 정리하고 종료.
    try {
      await getAdminAuth().deleteUser(callerUid);
    } catch {
      /* 이미 없으면 무시 */
    }
    return NextResponse.json({ ok: true, note: "user doc absent; auth deleted if existed" });
  }

  const userData = userSnap.data() as { partyIds?: string[] };
  const partyIds = userData.partyIds ?? [];

  // 각 공대 정리
  for (const partyId of partyIds) {
    const partyRef = db.doc(`parties/${partyId}`);
    const partySnap = await partyRef.get();
    if (!partySnap.exists) continue;

    const partyData = partySnap.data() as { leaderUid?: string };
    const isLeader = partyData.leaderUid === callerUid;

    if (isLeader) {
      // cascade disband — 모든 하위 컬렉션 + 다른 멤버 partyIds 정리
      const [membersSnap, availSnap, schedulesSnap] = await Promise.all([
        db.collection(`parties/${partyId}/members`).get(),
        db.collection(`parties/${partyId}/availabilities`).get(),
        db.collection(`parties/${partyId}/schedules`).get(),
      ]);
      const attendanceSnaps = await Promise.all(
        schedulesSnap.docs.map((s) =>
          db.collection(`parties/${partyId}/schedules/${s.id}/attendances`).get(),
        ),
      );

      const batch = db.batch();
      for (const snap of attendanceSnaps) {
        for (const att of snap.docs) batch.delete(att.ref);
      }
      for (const s of schedulesSnap.docs) batch.delete(s.ref);
      for (const a of availSnap.docs) batch.delete(a.ref);
      for (const m of membersSnap.docs) batch.delete(m.ref);
      // 다른 멤버들의 partyIds 정리 (본인은 어차피 user doc 통째로 삭제됨)
      for (const m of membersSnap.docs) {
        if (m.id !== callerUid) {
          batch.update(db.doc(`users/${m.id}`), {
            partyIds: FieldValue.arrayRemove(partyId),
          });
        }
      }
      batch.delete(partyRef);
      await batch.commit();
    } else {
      // self-kick — 본인 멤버 doc만 삭제. partyIds는 user doc 통째 삭제될 거라 생략.
      await db.doc(`parties/${partyId}/members/${callerUid}`).delete().catch(() => {
        /* 이미 없으면 무시 */
      });
    }
  }

  // users doc 삭제
  await userRef.delete();

  // Firebase Auth user 삭제
  try {
    await getAdminAuth().deleteUser(callerUid);
  } catch (err) {
    console.error("[account/delete] Auth deleteUser failed:", err);
    // 데이터는 정리됐으니 일단 성공 응답 (사용자 입장에선 로그인 시 재생성됨)
  }

  return NextResponse.json({ ok: true, partiesProcessed: partyIds.length });
}
