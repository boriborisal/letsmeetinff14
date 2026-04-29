"use client";

// 좌측 공대 정보 패널: 이름·레이드(편집)·초대코드·내 프로필·공대원 목록.
// 부모로부터 party + members + myMember 받음. 편집 후 onPartyUpdated로 부모에 알림.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  defaultPartyName,
  leaveParty,
  updateParty,
  updateProgressNote,
} from "@/lib/firestore/parties";
import { activeRaidContents, getRaidContent } from "@/lib/raid/contents";
import { JobIcon } from "@/components/common/JobIcon";
import {
  JOB_KOR,
  REEL_MIN_BY_TIER,
  SERVER_KOR,
  type Member,
  type Party,
} from "@/types";

interface Props {
  party: Party;
  members: Member[];
  myMember: Member;
  uid: string;
  onPartyUpdated: (p: Party) => void;
}

export function PartyInfoPanel({ party, members, myMember, uid, onPartyUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const isLeader = uid === party.leaderUid;
  const raid = getRaidContent(party.raidContentId);
  const reelMin = raid ? REEL_MIN_BY_TIER[raid.tier] : 120;
  const reels = party.reelsPerSession ?? 1;
  const sessionLabel = `${reels}릴 (${formatMin(reelMin * reels)})`;

  return (
    <aside className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{party.name}</h1>
          <p className="text-base text-muted-foreground">
            {raid?.nameKor ?? party.raidContentId}
            <span className="text-muted-foreground/70"> · 세션 {sessionLabel}</span>
          </p>
        </div>
        {isLeader && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-md border border-border bg-secondary px-2.5 py-1 text-[15px] transition hover:bg-accent"
          >
            수정
          </button>
        ) : null}
      </div>

      {isLeader && editing ? (
        <EditPartyForm
          party={party}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            onPartyUpdated(updated);
            setEditing(false);
          }}
        />
      ) : null}

      {/* 초대 코드 */}
      <section className="space-y-1.5 rounded-md border border-border bg-secondary px-3 py-2.5">
        <p className="text-[15px] text-muted-foreground">초대 코드</p>
        <p className="font-mono text-xl tracking-widest">{party.inviteCode}</p>
        <p className="text-base text-muted-foreground">
          공대원에게 코드 또는{" "}
          <Link
            href={`/join?code=${party.inviteCode}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            가입 링크
          </Link>
          .
        </p>
      </section>

      {/* 진도 메모 (모든 멤버 편집 가능) */}
      <ProgressNoteSection party={party} onUpdated={onPartyUpdated} />

      {/* 내 프로필 */}
      <section className="space-y-2 rounded-md border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">내 프로필</h2>
          <Link
            href={`/party/${party.id}/profile`}
            className="text-[15px] text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
          >
            편집
          </Link>
        </div>
        <dl className="space-y-1 text-[15px]">
          <Row label="캐릭" value={`${myMember.charName} (${SERVER_KOR[myMember.server]})`} />
          <Row
            label="메인"
            value={
              <span className="inline-flex items-center gap-1.5">
                {myMember.mainSlot} · <JobIcon job={myMember.mainJob} size={18} />
                {JOB_KOR[myMember.mainJob]}
              </span>
            }
          />
          <Row
            label="가능 잡"
            value={
              myMember.subJobs.length ? (
                <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {myMember.subJobs.map((j) => (
                    <span key={j} className="inline-flex items-center gap-1">
                      <JobIcon job={j} size={16} />
                      {JOB_KOR[j]}
                    </span>
                  ))}
                </span>
              ) : (
                "없음"
              )
            }
          />
          <Row
            label="체인지"
            value={myMember.changeSlots.length ? myMember.changeSlots.join(", ") : "없음"}
          />
          {myMember.fflogsUrl ? (
            <Row
              label="FFLogs"
              value={
                <a
                  href={myMember.fflogsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  링크
                </a>
              }
            />
          ) : null}
        </dl>
      </section>

      {/* 공대원 목록 */}
      <section className="space-y-2">
        <h2 className="text-base font-medium text-muted-foreground">
          공대원 ({members.length} / 8)
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
          {members.map((m) => (
            <li key={m.uid} className="flex items-center justify-between px-3 py-2 text-base">
              <div className="min-w-0">
                <p className="truncate">
                  {m.charName}
                  {m.role === "leader" ? (
                    <span className="ml-1.5 rounded bg-secondary px-1 py-px text-[15px] text-muted-foreground">
                      장
                    </span>
                  ) : null}
                </p>
                <p className="flex items-center gap-1 truncate text-base text-muted-foreground">
                  <span>{SERVER_KOR[m.server]} ·</span>
                  <JobIcon job={m.mainJob} size={18} />
                  <span>{JOB_KOR[m.mainJob]} · {m.mainSlot}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 위험 영역: 탈퇴 (리더 제외) */}
      <LeavePartySection partyId={party.id} uid={uid} isLeader={isLeader} />
    </aside>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 text-muted-foreground/70">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-foreground">{value}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────
// 인라인 수정 (리더만)
// ─────────────────────────────────────────────

function EditPartyForm({
  party,
  onCancel,
  onSaved,
}: {
  party: Party;
  onCancel: () => void;
  onSaved: (updated: Party) => void;
}) {
  const raids = useMemo(() => activeRaidContents(), []);
  const [name, setName] = useState(party.name);
  const [raidId, setRaidId] = useState(party.raidContentId);
  const [reelsPerSession, setReelsPerSession] = useState<number>(party.reelsPerSession ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reelMin = useMemo(() => {
    const r = getRaidContent(raidId);
    return r ? REEL_MIN_BY_TIER[r.tier] : 120;
  }, [raidId]);

  const grouped = useMemo(() => {
    const sav = raids.filter((r) => r.tier === "savage_4" || r.tier === "savage_1_3");
    const ext = raids.filter((r) => r.tier === "extreme");
    const ult = raids.filter((r) => r.tier === "ultimate");
    return { sav, ext, ult };
  }, [raids]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!raidId) return setError("레이드를 선택해주세요.");
    const finalName = name.trim() || defaultPartyName(raidId);
    setSaving(true);
    setError(null);
    try {
      await updateParty(party.id, {
        name: finalName,
        raidContentId: raidId,
        reelsPerSession,
      });
      onSaved({
        ...party,
        name: finalName,
        raidContentId: raidId,
        reelsPerSession,
      });
    } catch (err) {
      console.error(err);
      setError("수정에 실패했습니다.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border border-border bg-card p-3">
      <div className="space-y-1">
        <label htmlFor="edit-name" className="text-[15px] text-muted-foreground">
          공대 이름 <span className="text-muted-foreground/60">(선택)</span>
        </label>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-base outline-none focus:border-foreground"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="edit-raid" className="text-[15px] text-muted-foreground">
          도전 레이드
        </label>
        <select
          id="edit-raid"
          value={raidId}
          onChange={(e) => setRaidId(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-base outline-none focus:border-foreground"
        >
          <optgroup label="극만신">
            {grouped.ext.map((r) => (
              <option key={r.id} value={r.id}>{r.nameKor}</option>
            ))}
          </optgroup>
          <optgroup label="영식">
            {grouped.sav.map((r) => (
              <option key={r.id} value={r.id}>{r.nameKor}</option>
            ))}
          </optgroup>
          <optgroup label="절">
            {grouped.ult.map((r) => (
              <option key={r.id} value={r.id}>{r.nameKor}</option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="edit-reels" className="text-[15px] text-muted-foreground">
          한 세션에 진행할 1릴 개수
        </label>
        <select
          id="edit-reels"
          value={reelsPerSession}
          onChange={(e) => setReelsPerSession(Number(e.target.value))}
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-base outline-none focus:border-foreground"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}릴 ({formatMin(reelMin * n)})
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1.5 text-[15px] text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md px-2 py-1 text-[15px] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-foreground px-2.5 py-1 text-[15px] font-medium text-background transition disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// 진도 메모 (모든 멤버 편집 가능)
// ─────────────────────────────────────────────

function ProgressNoteSection({
  party,
  onUpdated,
}: {
  party: Party;
  onUpdated: (p: Party) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(party.progressNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateProgressNote(party.id, text);
      const trimmed = text.trim();
      onUpdated({ ...party, progressNote: trimmed || undefined });
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setText(party.progressNote ?? "");
    setEditing(false);
    setError(null);
  }

  return (
    <section className="space-y-2 rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">진도 메모</h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[15px] text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
          >
            편집
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-base outline-none focus:border-foreground"
          />
          {error ? (
            <p className="text-[15px] text-destructive">{error}</p>
          ) : null}
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="rounded-md px-2 py-1 text-[15px] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-md bg-foreground px-2.5 py-1 text-[15px] font-medium text-background transition disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      ) : party.progressNote ? (
        <p className="whitespace-pre-wrap text-base text-foreground">{party.progressNote}</p>
      ) : (
        <p className="text-base text-muted-foreground">메모 없음. 누구나 편집할 수 있습니다.</p>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// 공대 탈퇴 (리더 제외)
// ─────────────────────────────────────────────

function LeavePartySection({
  partyId,
  uid,
  isLeader,
}: {
  partyId: string;
  uid: string;
  isLeader: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLeader) {
    return (
      <p className="text-sm text-muted-foreground">
        공대장은 직접 탈퇴할 수 없습니다.
      </p>
    );
  }

  async function onLeave() {
    if (!window.confirm("정말 이 공대를 나가시겠습니까? 다시 가입하려면 초대 코드가 필요합니다.")) return;
    setBusy(true);
    setError(null);
    try {
      await leaveParty({ partyId, uid });
      router.replace("/");
    } catch (err) {
      console.error(err);
      setError("탈퇴에 실패했습니다.");
      setBusy(false);
    }
  }

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => void onLeave()}
        disabled={busy}
        className="text-[15px] text-muted-foreground underline-offset-4 transition hover:text-destructive hover:underline disabled:opacity-50"
      >
        {busy ? "탈퇴 중…" : "공대 나가기"}
      </button>
      {error ? (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function formatMin(min: number): string {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
