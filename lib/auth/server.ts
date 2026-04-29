// 서버 측 사용자 식별: 클라이언트가 Authorization: Bearer <ID_TOKEN> 헤더로 전달.
// Firebase Admin SDK가 토큰 서명/만료 검증.

import "server-only";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

/** Authorization 헤더에서 ID 토큰을 검증해 uid를 반환. 실패 시 null. */
export async function getUidFromRequest(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
