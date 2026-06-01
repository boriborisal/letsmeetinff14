import { HomeAuthCard } from "@/components/auth/HomeAuthCard";
import { HomeAnnouncements } from "@/components/home/HomeAnnouncements";
import { BugReportLinkCard } from "@/components/home/BugReportLinkCard";

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center gap-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight">{"Let's Meet in FF14"}</h1>
      <p className="max-w-md text-center text-muted-foreground">
        FF14 레이드 공대 일정 조율 + 출석 운영 도구
      </p>

      <HomeAuthCard />

      <HomeAnnouncements />
      <BugReportLinkCard />
    </main>
  );
}
