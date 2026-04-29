// 레거시 URL — 이제 /party/[id] 한 페이지에서 정보 + 일정 통합 표시.

import { redirect } from "next/navigation";

export default function LegacyAvailabilityPage({ params }: { params: { id: string } }) {
  redirect(`/party/${params.id}`);
}
