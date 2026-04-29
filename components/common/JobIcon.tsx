"use client";

// 직업 아이콘. 롤 색 배경 위에 /public/jobs/{JOB}.png 아이콘 합성.
//   - 탱커: 파랑, 힐러: 초록, 딜러(근접/원물/마법): 빨강
//   - 이미지 로드 실패 시 빈 색 사각형으로 fallback (롤 식별용 컬러 유지)

import { useState } from "react";
import { JOB_KOR, JOB_ROLE, type Job, type Role } from "@/types";

interface Props {
  job: Job;
  size?: number;
  className?: string;
}

const ROLE_BG: Record<Role, string> = {
  tank: "#3478c6",   // 파랑
  healer: "#3cc373", // 초록
  melee: "#d04a3f",  // 빨강 (딜러)
  ranged: "#d04a3f",
  caster: "#d04a3f",
};

export function JobIcon({ job, size = 20, className }: Props) {
  const [failed, setFailed] = useState(false);
  const bg = ROLE_BG[JOB_ROLE[job]];

  return (
    <span
      title={JOB_KOR[job]}
      aria-label={JOB_KOR[job]}
      className={[
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm align-middle",
        className ?? "",
      ].join(" ")}
      style={{ width: size, height: size, backgroundColor: bg }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/jobs/${job}.png`}
          alt=""
          width={size}
          height={size}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, objectFit: "contain" }}
        />
      ) : null}
    </span>
  );
}
