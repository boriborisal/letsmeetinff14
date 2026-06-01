"use client";

// 현재 로그인 사용자가 사이트 운영자인지 확인하는 클라이언트 훅.
// 서버의 /api/me/admin을 1회 호출하고 결과를 보관.
// UI 노출 제어용 — 실제 권한 체크는 서버에서 다시 한다.

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export function useAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const idToken = await getFirebaseAuth().currentUser?.getIdToken();
        if (!idToken) {
          if (!cancelled) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }
        const res = await fetch("/api/me/admin", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = (await res.json()) as { isAdmin?: boolean };
        if (!cancelled) {
          setIsAdmin(Boolean(data.isAdmin));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isAdmin, loading };
}
