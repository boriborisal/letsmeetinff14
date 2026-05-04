"use client";

// 공대원 상세 모달: 프로필(직업·자리·프프로그·자기소개) + 현재 주 가능 시간 그리드 (read-only).
// 리더가 본인 외 멤버를 보면 [강퇴] 버튼 노출.

import { useMemo, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { JobIcon } from "@/components/common/JobIcon";
import { AvailabilityGrid } from "@/components/availability/AvailabilityGrid";
import { kickMember } from "@/lib/firestore/kickClient";
import { safeHttpUrl } from "@/lib/utils/url";
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
  /** 모달을 보고 있는 사용자의 uid (강퇴 버튼 표시 판단용) */
  viewerUid: string;
  /** 모달을 보고 있는 사용자가 공대장인가 */
  viewerIsLeader: boolean;
  /** 강퇴된 후 호출 (모달 닫기 등) */
  onKicked?: () => void;
  partyId: string;
}

export function MemberDetailModal({
  open,
  onClose,
  member,
  raid,
  weekStart,
  memberAvailability,
  viewerUid,
  viewerIsLeader,
  onKicked,
  partyId,
}: Props) {
  const [kicking, setKicking] = useState(false);
  const [kickError, setKickError] = useState<string | null>(null);

  const canKick = !!member && viewerIsLeader && member.uid !== viewerUid && member.role !== "leader";

  async function onKick() {
    if (!member) return;
    if (!window.confirm(`정말 ${member.charName}님을 강퇴하시겠습니까?\n다시 참여하려면 새 초대 코드로 가입해야 합니다.`)) {
      return;
    }
    setKicking(true);
    setKickError(null);
    try {
      await kickMember({ partyId, uid: member.uid });
      onKicked?.();
      onClose();
    } catch (err) {
      setKickError(err instanceof Error ? err.message : "강퇴 실패");
    } finally {
      setKicking(false);
    }
  }
  const tier = raid?.tier ?? "ultimate";
  const reelLen = useMemo(() => reelSlotsForTier(tier), [tier]);
  const memberSlots = useMemo(
    () => new Set<SlotKey>(memberAvailability?.available ?? []),
    [memberAvailability],
  );

  if (!member) return null;
  const profileSet = member.profileSetup !== false;

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
              {profileSet ? SERVER_KOR[member.server] : "프로필 미설정"}
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

        {/* 프로필 미설정 안내 */}
        {!profileSet ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            이 공대원은 아직 프로필(서버·직업·자리)을 설정하지 않았습니다.
          </p>
        ) : null}

        {/* 프로필 정보 (설정된 경우만) */}
        {profileSet ? (
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
          {(() => {
            const url = safeHttpUrl(member.fflogsUrl);
            return url ? (
              <ProfileRow label="FFLogs">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {url}
                </a>
              </ProfileRow>
            ) : null;
          })()}
          {member.bio ? (
            <ProfileRow label="소개">
              <span className="whitespace-pre-wrap">{member.bio}</span>
            </ProfileRow>
          ) : null}
        </dl>
        ) : null}

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
              disableTooltip
            />
          </div>
        </section>

        {/* 위험 영역: 강퇴 (리더 + 본인 외 + 일반 멤버 한정) */}
        {canKick ? (
          <section className="flex items-center justify-end border-t border-border pt-4">
            <div className="flex flex-col items-end gap-1.5">
              <button
                type="button"
                onClick={() => void onKick()}
                disabled={kicking}
                className="shrink-0 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {kicking ? "강퇴 중…" : "강퇴"}
              </button>
              {kickError ? (
                <p className="text-xs text-red-500">{kickError}</p>
              ) : null}
            </div>
          </section>
        ) : null}
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
