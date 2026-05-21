"use client";

// Firebase Auth 상태를 React Context로 노출.
// 루트 layout에서 한 번 감싸면 모든 client component에서 useAuth() 사용 가능.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    // 클라 세션이 비어 있을 때 서버 세션 쿠키(ff_session)로 1회 복구 시도.
    // 디스코드 인앱 브라우저 등에서 IndexedDB가 휘발돼도 재로그인 없이 복구된다.
    let triedRecovery = false;

    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
        return;
      }
      // 세션 없음 — 첫 null이면 서버 쿠키로 복구 시도, 이후엔 진짜 로그아웃 상태.
      if (triedRecovery) {
        setUser(null);
        setLoading(false);
        return;
      }
      triedRecovery = true;
      void (async () => {
        try {
          const res = await fetch("/api/auth/session");
          const data = (await res.json()) as { customToken?: string | null };
          if (data.customToken) {
            await signInWithCustomToken(auth, data.customToken);
            // 복구 성공 시 onAuthStateChanged가 user와 함께 다시 발화 → 위 분기서 처리.
            // 세션 쿠키도 새로 갱신해 만료 시점을 미룬다(rolling).
            const idToken = await auth.currentUser?.getIdToken();
            if (idToken) {
              void fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
              });
            }
            return;
          }
        } catch {
          /* 복구 실패 — 로그아웃 상태로 처리 */
        }
        setUser(null);
        setLoading(false);
      })();
    });
  }, []);

  async function logout() {
    await signOut(getFirebaseAuth());
    // 서버 쿠키 정리 (state 쿠키 등)
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
