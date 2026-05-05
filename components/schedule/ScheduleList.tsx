"use client";

// 한 주 확정 일정 목록.
//   - 각 일정: 시간 표기 + 본인 출석 토글 + 출/결/미정/무응답 카운트
//   - 결석 선택 시 사유 메모 inline
//   - 공대장: [휴공] / [취소] 토글 + 일정 삭제는 안 함 (휴공만)

import { useEffect, useMemo, useState } from "react";
import { weekDays } from "@/lib/datetime/week";
import { describeReelRange } from "@/lib/datetime/format";
import {
  cancelSchedule,
  reactivateSchedule,
  subscribeSchedules,
} from "@/lib/firestore/schedules";
import { listAttendances, setMyAttendance } from "@/lib/firestore/attendance";
import type {
  Attendance,
  AttendanceStatus,
  Member,
  Schedule,
} from "@/types";

interface Props {
  partyId: string;
  weekStart: string;
  uid: string;
  isLeader: boolean;
  members: Member[];
}

export function ScheduleList({
  partyId,
  weekStart,
  uid,
  isLeader,
  members,
}: Props) {
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [attendanceByScheduleId, setAttendanceByScheduleId] = useState<
    Record<string, Attendance[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [attReloadKey, setAttReloadKey] = useState(0);

  const weekIsoSet = useMemo(
    () => new Set(weekDays(weekStart).map((d) => d.iso)),
    [weekStart],
  );

  // 일정 자체는 실시간 구독 (확정/휴공이 즉시 반영)
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeSchedules(partyId, (list) => {
      setAllSchedules(list);
      setLoading(false);
    });
    return unsub;
  }, [partyId]);

  // 이번 주에 해당하는 일정만 필터
  const schedules = useMemo(
    () =>
      allSchedules
        .filter((s) => weekIsoSet.has(s.reelStart.split("T")[0]!))
        .sort((a, b) => (a.reelStart < b.reelStart ? -1 : 1)),
    [allSchedules, weekIsoSet],
  );

  // 출석은 일정 변경 시 / 명시적 갱신 시에만 fetch (참여 응답 변화는 row 자체에서 처리)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        schedules.map(async (s) => {
          const list = await listAttendances(partyId, s.id);
          return [s.id, list] as const;
        }),
      );
      if (cancelled) return;
      setAttendanceByScheduleId(Object.fromEntries(entries));
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [partyId, schedules, attReloadKey]);

  if (loading) {
    return (
      <div className="rounded-md border border-border bg-card px-4 py-3 text-base text-muted-foreground">
        일정 불러오는 중…
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card px-4 py-3 text-base text-muted-foreground">
        이 주에 확정된 일정이 없습니다.
      </div>
    );
  }

  return (
    <section className="space-y-2">
      <h3 className="text-base font-medium text-muted-foreground">확정 일정</h3>
      <ul className="space-y-2">
        {schedules.map((s) => (
          <li key={s.id}>
            <ScheduleRow
              schedule={s}
              attendances={attendanceByScheduleId[s.id] ?? []}
              partyId={partyId}
              uid={uid}
              isLeader={isLeader}
              members={members}
              onChanged={() => setAttReloadKey((k) => k + 1)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScheduleRow({
  schedule,
  attendances,
  partyId,
  uid,
  isLeader,
  members,
  onChanged,
}: {
  schedule: Schedule;
  attendances: Attendance[];
  partyId: string;
  uid: string;
  isLeader: boolean;
  members: Member[];
  onChanged: () => void;
}) {
  const myAtt = attendances.find((a) => a.uid === uid);
  const [status, setStatus] = useState<AttendanceStatus | null>(myAtt?.status ?? null);
  const [reason, setReason] = useState(myAtt?.reason ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { going: 0, absent: 0, tentative: 0 };
    for (const a of attendances) {
      if (a.status === "going") c.going++;
      else if (a.status === "absent") c.absent++;
      else c.tentative++;
    }
    return c;
  }, [attendances]);
  const noResponse = Math.max(0, members.length - attendances.length);

  async function changeStatus(newStatus: AttendanceStatus) {
    setBusy(true);
    setError(null);
    try {
      await setMyAttendance({
        partyId,
        scheduleId: schedule.id,
        uid,
        status: newStatus,
        // 결석이 아니게 되면 사유 비움
        reason: newStatus === "absent" ? reason : "",
      });
      setStatus(newStatus);
      onChanged();
    } catch (err) {
      console.error(err);
      setError("저장 실패");
    } finally {
      setBusy(false);
    }
  }

  async function saveReasonOnBlur() {
    if (status !== "absent") return;
    if ((myAtt?.reason ?? "") === reason) return;
    setBusy(true);
    setError(null);
    try {
      await setMyAttendance({
        partyId,
        scheduleId: schedule.id,
        uid,
        status: "absent",
        reason,
      });
      onChanged();
    } catch (err) {
      console.error(err);
      setError("사유 저장 실패");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCancel() {
    if (!isLeader) return;
    setBusy(true);
    setError(null);
    try {
      if (schedule.cancelled) {
        await reactivateSchedule({ partyId, scheduleId: schedule.id });
      } else {
        await cancelSchedule({ partyId, scheduleId: schedule.id });
      }
      onChanged();
    } catch (err) {
      console.error(err);
      setError("처리 실패");
    } finally {
      setBusy(false);
    }
  }

  const isCancelled = !!schedule.cancelled;
  const [expanded, setExpanded] = useState(false);

  // status별 멤버 그룹핑
  const memberByUid = useMemo(
    () => new Map(members.map((m) => [m.uid, m])),
    [members],
  );
  const grouped = useMemo(() => {
    const going: Attendance[] = [];
    const absent: Attendance[] = [];
    const tentative: Attendance[] = [];
    for (const a of attendances) {
      if (a.status === "going") going.push(a);
      else if (a.status === "absent") absent.push(a);
      else tentative.push(a);
    }
    const respondedUids = new Set(attendances.map((a) => a.uid));
    const noRespondMembers = members.filter((m) => !respondedUids.has(m.uid));
    return { going, absent, tentative, noRespondMembers };
  }, [attendances, members]);

  return (
    <div
      className={[
        "rounded-md border px-3 py-2.5 text-base",
        isCancelled
          ? "border-border/60 bg-secondary/40 text-muted-foreground"
          : "border-border bg-card",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className={isCancelled ? "line-through" : "font-medium"}>
            {describeReelRange(schedule.reelStart, schedule.reelEnd)}
            {isCancelled ? (
              <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[13px] text-muted-foreground no-underline">
                휴공
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-left text-sm text-muted-foreground transition hover:text-foreground"
          >
            출 {counts.going} · 결 {counts.absent} · 미정 {counts.tentative} · 무응답 {noResponse}
            <span className="ml-1.5 text-xs">{expanded ? "▾" : "▸"}</span>
          </button>
        </div>

        {isLeader ? (
          <button
            type="button"
            onClick={() => void toggleCancel()}
            disabled={busy}
            className="rounded-md border border-border bg-secondary px-2 py-1 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            {isCancelled ? "휴공 취소" : "휴공"}
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-2 space-y-1.5 rounded-md bg-secondary/40 px-3 py-2 text-sm">
          <DetailRow label="출석" count={grouped.going.length}>
            {grouped.going.length > 0
              ? grouped.going
                  .map((a) => memberByUid.get(a.uid)?.charName ?? a.uid)
                  .join(", ")
              : "—"}
          </DetailRow>
          <DetailRow label="결석" count={grouped.absent.length}>
            {grouped.absent.length > 0 ? (
              <ul className="space-y-0.5">
                {grouped.absent.map((a) => {
                  const name = memberByUid.get(a.uid)?.charName ?? a.uid;
                  return (
                    <li key={a.uid}>
                      {name}
                      {a.reason ? (
                        <span className="text-muted-foreground"> — {a.reason}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="미정" count={grouped.tentative.length}>
            {grouped.tentative.length > 0
              ? grouped.tentative
                  .map((a) => memberByUid.get(a.uid)?.charName ?? a.uid)
                  .join(", ")
              : "—"}
          </DetailRow>
          <DetailRow label="무응답" count={grouped.noRespondMembers.length}>
            {grouped.noRespondMembers.length > 0
              ? grouped.noRespondMembers.map((m) => m.charName).join(", ")
              : "—"}
          </DetailRow>
        </div>
      ) : null}

      {!isCancelled ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">내 출석</span>
          <AttendanceChip
            label="출"
            active={status === "going"}
            onClick={() => void changeStatus("going")}
            disabled={busy}
          />
          <AttendanceChip
            label="결"
            active={status === "absent"}
            onClick={() => void changeStatus("absent")}
            disabled={busy}
          />
          <AttendanceChip
            label="미정"
            active={status === "tentative"}
            onClick={() => void changeStatus("tentative")}
            disabled={busy}
          />
          {status === "absent" ? (
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => void saveReasonOnBlur()}
              maxLength={60}
              className="ml-1 min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-foreground"
            />
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function DetailRow({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <span className="shrink-0 text-xs text-muted-foreground/80">
        {label} ({count})
      </span>
      <span className="min-w-0 flex-1 text-foreground">{children}</span>
    </div>
  );
}

function AttendanceChip({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-md border px-2.5 py-1 text-sm transition",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-secondary text-foreground hover:bg-accent",
        disabled ? "opacity-50" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
