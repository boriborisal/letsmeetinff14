// GET /api/me/admin
// Header: Authorization: Bearer <Firebase ID token>
// Response: { isAdmin: boolean }
//
// 클라이언트 UI에서 "공지사항 작성", "버그리포트 답변" 등 운영자 전용 컨트롤
// 노출 여부 결정에만 사용. 실제 권한 체크는 항상 서버에서 다시 한다.

import { NextResponse, type NextRequest } from "next/server";
import { getUidFromRequest } from "@/lib/auth/server";
import { isAdminUid } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await getUidFromRequest(req);
  if (!uid) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
  return NextResponse.json({ isAdmin: isAdminUid(uid) });
}
