// POST /api/parties/join
// Body: { inviteCode: string, charName: string }
// Header: Authorization: Bearer <Firebase ID token>
//
// 흐름:
//   1. ID 토큰 검증 → uid
//   2. inviteCode로 parties 검색 (Admin SDK는 룰 우회)
//   3. 이미 멤버면 멱등 (성공으로 처리)
//   4. 신규 가입: 멤버 doc 생성 + users.partyIds += partyId

import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getUidFromRequest } from "@/lib/auth/server";
import type { Member } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JoinBody {
  inviteCode?: string;
  charName?: string;
}

export async function POST(req: NextRequest) {
  const uid = await getUidFromRequest(req);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: JoinBody;
  try {
    body = (await req.json()) as JoinBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const code = body.inviteCode?.trim().toUpperCase();
  const charName = body.charName?.trim();

  if (!code) {
    return NextResponse.json({ error: "초대 코드를 입력해주세요." }, { status: 400 });
  }
  if (!charName) {
    return NextResponse.json({ error: "캐릭명을 입력해주세요." }, { status: 400 });
  }

  const db = getAdminDb();

  // 초대 코드로 공대 찾기
  const partySnap = await db
    .collection("parties")
    .where("inviteCode", "==", code)
    .limit(1)
    .get();

  if (partySnap.empty) {
    return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });
  }

  const partyDoc = partySnap.docs[0]!;
  const partyId = partyDoc.id;

  const memberRef = db.doc(`parties/${partyId}/members/${uid}`);
  const userRef = db.doc(`users/${uid}`);

  const existing = await memberRef.get();
  if (existing.exists) {
    // 이미 가입된 경우: 멱등하게 성공으로 응답 (가입 페이지 → 공대 페이지로 이동)
    return NextResponse.json({ partyId, alreadyMember: true });
  }

  const now = Date.now();
  const memberDoc: Member = {
    partyId,
    uid,
    role: "member",
    charName,
    server: "Moogle",     // 임시 default — 프로필에서 변경
    mainJob: "WAR",       // 임시 default
    subJobs: [],
    mainSlot: "MT",       // 임시 default
    changeSlots: [],
    joinedAt: now,
  };

  const batch = db.batch();
  batch.set(memberRef, memberDoc);
  batch.set(userRef, { partyIds: FieldValue.arrayUnion(partyId) }, { merge: true });
  await batch.commit();

  return NextResponse.json({ partyId, alreadyMember: false });
}
