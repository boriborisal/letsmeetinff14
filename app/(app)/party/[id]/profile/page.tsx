"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMember, updateMyMemberProfile } from "@/lib/firestore/members";
import { JobIcon } from "@/components/common/JobIcon";
import {
  ALL_SERVERS,
  ALL_SLOTS,
  JOB_KOR,
  JOBS_BY_ROLE,
  ROLE_KOR,
  ROLE_ORDER,
  SERVER_KOR,
  SLOT_DESC,
  type Job,
  type Member,
  type Server,
  type Slot,
} from "@/types";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { id: partyId } = params;
  const { user } = useAuth();
  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [charName, setCharName] = useState("");
  const [server, setServer] = useState<Server>("Moogle");
  const [mainJob, setMainJob] = useState<Job>("WAR");
  const [subJobs, setSubJobs] = useState<Set<Job>>(new Set());
  const [mainSlot, setMainSlot] = useState<Slot>("MT");
  const [changeSlots, setChangeSlots] = useState<Set<Slot>>(new Set());
  const [fflogsUrl, setFflogsUrl] = useState("");
  const [bio, setBio] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMember(partyId, user.uid)
      .then((m) => {
        if (cancelled) return;
        if (!m) {
          setLoadError("이 공대의 멤버가 아닙니다.");
          return;
        }
        setMember(m);
        setCharName(m.charName);
        setServer(m.server);
        setMainJob(m.mainJob);
        setSubJobs(new Set(m.subJobs));
        setMainSlot(m.mainSlot);
        setChangeSlots(new Set(m.changeSlots));
        setFflogsUrl(m.fflogsUrl ?? "");
        setBio(m.bio ?? "");
      })
      .catch(() => !cancelled && setLoadError("프로필을 불러오지 못했습니다."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [partyId, user]);

  function toggleSubJob(job: Job) {
    setSubJobs((prev) => {
      const next = new Set(prev);
      if (next.has(job)) next.delete(job);
      else next.add(job);
      return next;
    });
  }

  function toggleChangeSlot(slot: Slot) {
    setChangeSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!charName.trim()) return setSaveError("캐릭명을 입력해주세요.");

    // 메인 잡은 가능 잡 목록에서 제외 (중복 방지)
    const finalSubJobs = Array.from(subJobs).filter((j) => j !== mainJob);
    // 메인 자리는 체인지 가능 자리에서 제외
    const finalChangeSlots = Array.from(changeSlots).filter((s) => s !== mainSlot);

    setSaving(true);
    setSaveError(null);
    try {
      await updateMyMemberProfile(partyId, user.uid, {
        charName: charName.trim(),
        server,
        mainJob,
        subJobs: finalSubJobs,
        mainSlot,
        changeSlots: finalChangeSlots,
        fflogsUrl: fflogsUrl.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      router.replace(`/party/${partyId}`);
    } catch (err) {
      console.error(err);
      setSaveError("저장에 실패했습니다.");
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="container py-10 text-sm text-muted-foreground">불러오는 중…</main>;
  }
  if (loadError || !member) {
    return (
      <main className="container space-y-3 py-10">
        <p className="text-sm text-destructive">{loadError}</p>
        <Link href={`/party/${partyId}`} className="text-sm text-muted-foreground underline">
          공대로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="container max-w-2xl space-y-6 py-10">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">프로필 설정</h1>
        <p className="text-sm text-muted-foreground">
          이 공대 안에서 사용할 캐릭 정보 · 직업 · 자리.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-7">
        {/* 기본 정보 */}
        <section className="space-y-4 rounded-md border border-border bg-card p-4">
          <h2 className="text-sm font-medium">기본 정보</h2>

          <Field label="캐릭명">
            <input
              type="text"
              value={charName}
              onChange={(e) => setCharName(e.target.value)}
              maxLength={30}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>

          <Field label="서버">
            <div className="flex flex-wrap gap-2">
              {ALL_SERVERS.map((s) => (
                <Chip
                  key={s}
                  active={server === s}
                  onClick={() => setServer(s)}
                  type="button"
                >
                  {SERVER_KOR[s]}
                </Chip>
              ))}
            </div>
          </Field>
        </section>

        {/* 직업 */}
        <section className="space-y-4 rounded-md border border-border bg-card p-4">
          <h2 className="text-sm font-medium">직업</h2>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">메인 잡 (1개)</p>
            <RoleGroupedJobs
              selected={new Set([mainJob])}
              onPick={(j) => setMainJob(j)}
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              가능한 다른 잡 (복수 선택, 메인 잡 제외)
            </p>
            <RoleGroupedJobs
              selected={subJobs}
              onPick={toggleSubJob}
              disabledJobs={new Set([mainJob])}
            />
          </div>
        </section>

        {/* 자리 */}
        <section className="space-y-4 rounded-md border border-border bg-card p-4">
          <h2 className="text-sm font-medium">자리</h2>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">메인 자리 (1개)</p>
            <SlotGrid selected={new Set([mainSlot])} onPick={(s) => setMainSlot(s)} />
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              체인지 가능 자리 (복수 선택, 메인 자리 제외)
            </p>
            <SlotGrid
              selected={changeSlots}
              onPick={toggleChangeSlot}
              disabledSlots={new Set([mainSlot])}
            />
          </div>
        </section>

        {/* 추가 */}
        <section className="space-y-4 rounded-md border border-border bg-card p-4">
          <h2 className="text-sm font-medium">추가 정보 (선택)</h2>

          <Field label="프프로그(FFLogs) URL">
            <input
              type="url"
              value={fflogsUrl}
              onChange={(e) => setFflogsUrl(e.target.value)}
              placeholder="https://www.fflogs.com/character/..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>

          <Field label="자기소개 (한 줄)">
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={80}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>
        </section>

        {saveError ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {saveError}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/party/${partyId}`}
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </main>
  );
}

// ─────────────────────────────────────────────
// 작은 sub-components
// ─────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Chip({
  children,
  active,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-md border px-3 py-1.5 text-xs transition",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-secondary text-foreground hover:bg-accent",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function RoleGroupedJobs({
  selected,
  onPick,
  disabledJobs,
}: {
  selected: Set<Job>;
  onPick: (j: Job) => void;
  disabledJobs?: Set<Job>;
}) {
  return (
    <div className="space-y-2">
      {ROLE_ORDER.map((role) => (
        <div key={role} className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">{ROLE_KOR[role]}</span>
          {JOBS_BY_ROLE[role].map((job) => (
            <Chip
              key={job}
              active={selected.has(job)}
              disabled={disabledJobs?.has(job)}
              onClick={() => onPick(job)}
            >
              <span className="inline-flex items-center gap-1.5">
                <JobIcon job={job} size={18} />
                {JOB_KOR[job]}
              </span>
            </Chip>
          ))}
        </div>
      ))}
    </div>
  );
}

function SlotGrid({
  selected,
  onPick,
  disabledSlots,
}: {
  selected: Set<Slot>;
  onPick: (s: Slot) => void;
  disabledSlots?: Set<Slot>;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {ALL_SLOTS.map((slot) => (
        <button
          key={slot}
          type="button"
          disabled={disabledSlots?.has(slot)}
          onClick={() => onPick(slot)}
          title={SLOT_DESC[slot]}
          className={[
            "flex flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-2 text-xs transition",
            selected.has(slot)
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-secondary text-foreground hover:bg-accent",
            disabledSlots?.has(slot) ? "opacity-40 cursor-not-allowed" : "",
          ].join(" ")}
        >
          <span className="font-mono font-semibold">{slot}</span>
          <span className="text-[10px] text-muted-foreground/80">{SLOT_DESC[slot].split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}
