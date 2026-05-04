"use client";

// (app) 헤더 우상단의 사용자 메뉴.
// 트리거: Discord 아바타 + 닉네임. 클릭 시 드롭다운 (로그아웃 / 계정 삭제).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { deleteMyAccount } from "@/lib/firestore/accountClient";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"none" | "logout" | "delete">("none");
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 / ESC로 닫기
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  async function onLogout() {
    setBusy("logout");
    try {
      await logout();
    } finally {
      setBusy("none");
      setOpen(false);
    }
  }

  async function onDelete() {
    if (
      !window.confirm(
        "계정을 정말 삭제하시겠어요?\n\n" +
          "소속된 모든 공대에서 자동으로 탈퇴되고,\n" +
          "입력한 가능 시간·출석 기록도 모두 사라져요.\n" +
          "이 동작은 되돌릴 수 없습니다.",
      )
    ) {
      return;
    }
    setBusy("delete");
    setError(null);
    try {
      await deleteMyAccount();
      router.replace("/");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "계정 삭제 실패");
      setBusy("none");
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition hover:bg-accent"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            className="h-6 w-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <span className="text-foreground">{user.displayName ?? "사용자"}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <button
            type="button"
            onClick={() => void onLogout()}
            disabled={busy !== "none"}
            className="block w-full px-3 py-2 text-left text-sm transition hover:bg-accent disabled:opacity-50"
          >
            {busy === "logout" ? "로그아웃 중…" : "로그아웃"}
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={busy !== "none"}
            className="block w-full border-t border-border px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {busy === "delete" ? "삭제 중…" : "계정 삭제"}
          </button>
          {error ? (
            <p className="border-t border-border bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
