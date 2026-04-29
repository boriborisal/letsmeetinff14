"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { activeRaidContents, getRaidContent } from "@/lib/raid/contents";
import { createParty } from "@/lib/firestore/parties";
import { REEL_MIN_BY_TIER } from "@/types";

export default function NewPartyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const raids = useMemo(() => activeRaidContents(), []);

  const [name, setName] = useState("");
  const [raidId, setRaidId] = useState<string>(raids[0]?.id ?? "");
  const [reelsPerSession, setReelsPerSession] = useState<number>(1);
  const [charName, setCharName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1릴 분 (선택한 raid 기준)
  const reelMin = useMemo(() => {
    const raid = getRaidContent(raidId);
    return raid ? REEL_MIN_BY_TIER[raid.tier] : 120;
  }, [raidId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!charName.trim()) return setError("본인 캐릭명을 입력해주세요.");
    if (!raidId) return setError("도전할 레이드를 선택해주세요.");

    setSubmitting(true);
    setError(null);
    try {
      const { partyId } = await createParty({
        name: name.trim(),
        raidContentId: raidId,
        reelsPerSession,
        leader: { uid: user.uid, charName: charName.trim() },
      });
      router.replace(`/party/${partyId}`);
    } catch (err) {
      console.error(err);
      setError("공대 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  // 카테고리 그룹핑 (영식 / 극만신 / 절)
  const grouped = useMemo(() => {
    const sav = raids.filter((r) => r.tier === "savage_4" || r.tier === "savage_1_3");
    const ext = raids.filter((r) => r.tier === "extreme");
    const ult = raids.filter((r) => r.tier === "ultimate");
    return { sav, ext, ult };
  }, [raids]);

  return (
    <main className="container max-w-md py-10">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">공대 만들기</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        본인이 공대장이 됩니다. 만든 후 초대 코드로 공대원을 모으세요.
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs text-muted-foreground">
            공대 이름 <span className="text-muted-foreground/60">(선택)</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="비우면 레이드 이름으로 자동 설정"
            maxLength={40}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="raid" className="text-xs text-muted-foreground">
            도전 레이드
          </label>
          <select
            id="raid"
            value={raidId}
            onChange={(e) => setRaidId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          >
            <optgroup label="극만신">
              {grouped.ext.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameKor}
                </option>
              ))}
            </optgroup>
            <optgroup label="영식">
              {grouped.sav.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameKor}
                </option>
              ))}
            </optgroup>
            <optgroup label="절">
              {grouped.ult.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameKor}
                </option>
              ))}
            </optgroup>
          </select>
          <p className="text-xs text-muted-foreground">
            1릴 길이는 레이드 종류에 따라 자동 결정됩니다 (현재 선택: 1릴 {formatMin(reelMin)}).
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reels" className="text-xs text-muted-foreground">
            한 세션에 진행할 1릴 개수
          </label>
          <select
            id="reels"
            value={reelsPerSession}
            onChange={(e) => setReelsPerSession(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}릴 ({formatMin(reelMin * n)})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            추천 시간대와 일정 확정 길이가 이 값에 맞춰 결정됩니다. 나중에 변경 가능.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="char" className="text-xs text-muted-foreground">
            본인 캐릭명
          </label>
          <input
            id="char"
            type="text"
            value={charName}
            onChange={(e) => setCharName(e.target.value)}
            placeholder="예: Hilda Lockhart"
            maxLength={30}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <p className="text-xs text-muted-foreground">
            서버·직업·자리는 공대 생성 후 프로필에서 설정합니다.
          </p>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition disabled:opacity-50"
        >
          {submitting ? "만드는 중…" : "공대 만들기"}
        </button>
      </form>
    </main>
  );
}

function formatMin(min: number): string {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
