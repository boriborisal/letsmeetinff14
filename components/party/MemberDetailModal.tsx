"use client";

// 공대원 상세 모달: 프로필(직업·자리·프프로그·자기소개) + 현재 주 가능 시간 그리드 (read-only).

import { useMemo } from "react";
import { Modal } from "@/components/common/Modal";
import { JobIcon } from "@/components/common/JobIcon";
import { AvailabilityGrid } from "@/components/availability/AvailabilityGrid";
import {
  JOB_KOR,
  ROLE_KOR,
  SERVER_KOR,
  reelSlotsForTier,
  type Availability,
  type Member,
  type RaidContent,
  type SlotKey,
} from "@/types";
import { JOB_ROLE } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  member: Member | null;
  raid: RaidContent | undefined;
  weekStart: string;
  // 부모가 가진 weekAvailabilities에서 멤버용을 미리 찾아 전달
  memberAvailability: Availability | undefined;
}

export function MemberDetailModal({
  open,
  onClose,
  member,
  raid,
  weekStart,
  memberAvailability,
}: Props) {
  const tier = raid?.tier ?? "ultimate";
  const reelLen = useMemo(() => reelSlotsForTier(tier), [tier]);
  const memberSlots = useMemo(
    () => new Set<SlotKey>(memberAvailability?.available ?? []),
    [memberAvailability],
  );

  if (!member) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {member.charName}
              {member.role === "leader" ? (
                <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-sm text-muted-foreground">
                  공대장
                </span>
              ) : null}
            </h2>
            <p className="text-sm text-muted-foreground">
              {SERVER_KOR[member.server]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-base text-muted-foreground transition hover:text-foreground"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 프로필 정보 */}
        <dl className="space-y-2 text-sm">
          <ProfileRow label="메인">
            <span className="inline-flex items-center gap-1.5">
              <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                {member.mainSlot}
              </span>
              <JobIcon job={member.mainJob} size={18} />
              <span>
                {JOB_KOR[member.mainJob]}{" "}
                <span className="text-muted-foreground">
                  ({ROLE_KOR[JOB_ROLE[member.mainJob]]})
                </span>
              </span>
            </span>
          </ProfileRow>
          <ProfileRow label="가능 잡">
            {member.subJobs.length > 0 ? (
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1.5">
                {member.subJobs.map((j) => (
                  <span key={j} className="inline-flex items-center gap-1">
                    <JobIcon job={j} size={16} />
                    {JOB_KOR[j]}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">없음</span>
            )}
          </ProfileRow>
          <ProfileRow label="체인지 자리">
            {member.changeSlots.length > 0
              ? member.changeSlots.join(", ")
              : <span className="text-muted-foreground">없음</span>}
          </ProfileRow>
          {member.fflogsUrl ? (
            <ProfileRow label="FFLogs">
              <a
                href={member.fflogsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {member.fflogsUrl}
              </a>
            </ProfileRow>
          ) : null}
          {member.bio ? (
            <ProfileRow label="소개">
              <span className="whitespace-pre-wrap">{member.bio}</span>
            </ProfileRow>
          ) : null}
        </dl>

        {/* 가능 시간 그리드 (read-only, 본인 슬롯만 .on) */}
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            이번 주 가능 시간
            {memberAvailability?.submitted ? null : (
              <span className="ml-1.5 text-destructive">· 미제출</span>
            )}
          </h3>
          <div className="rounded-md border border-border bg-card/50 p-3">
            <AvailabilityGrid
              weekStart={weekStart}
              reelLen={reelLen}
              mode="input"
              selfSlots={memberSlots}
              othersCount={new Map()}
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}

function ProfileRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <dt className="w-20 shrink-0 text-xs text-muted-foreground/70">{label}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{children}</dd>
    </div>
  );
}
