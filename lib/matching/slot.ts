// 8자리 매칭: 응답 가능한 멤버들을 8자리(MT/ST/MH/SH/D1~D4)에 배치 가능한지 검사.
//
// 규칙:
// - 한 자리에 한 명만, 한 명은 한 자리만.
// - 멤버는 자신의 mainSlot 또는 changeSlots 중 하나에 배치 가능.
// - 8! = 40320이라 단순 backtracking으로 충분.
//
// 입력: 1릴 전체 시간에 응답 가능한 멤버들의 자리 후보 정보.
// 출력: 가능 여부 + 배치 결과 (가능할 때).

import { ALL_SLOTS, type Member, type Slot, type SlotAssignment, type User } from "@/types";

export interface MemberSlotCandidate {
  uid: User["uid"];
  candidates: Slot[]; // mainSlot ∪ changeSlots
}

export function memberCandidates(member: Pick<Member, "uid" | "mainSlot" | "changeSlots">): MemberSlotCandidate {
  const set = new Set<Slot>([member.mainSlot, ...member.changeSlots]);
  return { uid: member.uid, candidates: Array.from(set) };
}

export interface SlotMatchResult {
  canDepart: boolean;
  assignment?: SlotAssignment;
}

/**
 * 주어진 멤버 후보들로 8자리를 모두 채울 수 있는지 검사.
 * 채울 수 있으면 assignment 반환.
 */
export function matchSlots(members: MemberSlotCandidate[]): SlotMatchResult {
  if (members.length < ALL_SLOTS.length) {
    return { canDepart: false };
  }

  // 각 자리별 후보 멤버 인덱스 목록
  const slotToMembers = new Map<Slot, number[]>();
  for (const slot of ALL_SLOTS) slotToMembers.set(slot, []);
  members.forEach((m, idx) => {
    for (const slot of m.candidates) {
      slotToMembers.get(slot)?.push(idx);
    }
  });

  // 후보 수 적은 자리부터 채우면 가지치기 효과
  const slotsByConstraint = [...ALL_SLOTS].sort(
    (a, b) => (slotToMembers.get(a)!.length) - (slotToMembers.get(b)!.length),
  );

  const assignment: SlotAssignment = {};
  const usedMember = new Set<number>();

  function backtrack(i: number): boolean {
    if (i === slotsByConstraint.length) return true;
    const slot = slotsByConstraint[i]!;
    for (const memberIdx of slotToMembers.get(slot)!) {
      if (usedMember.has(memberIdx)) continue;
      usedMember.add(memberIdx);
      assignment[slot] = members[memberIdx]!.uid;
      if (backtrack(i + 1)) return true;
      usedMember.delete(memberIdx);
      delete assignment[slot];
    }
    return false;
  }

  return backtrack(0)
    ? { canDepart: true, assignment }
    : { canDepart: false };
}
