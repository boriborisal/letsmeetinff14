import { HomeAuthCard } from "@/components/auth/HomeAuthCard";

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">{"Let's Meet in FF14"}</h1>
      <p className="max-w-md text-center text-muted-foreground">
        FF14 레이드 공대 일정 조율 + 출석 운영 도구
      </p>

      <HomeAuthCard />

      <p className="text-xs text-muted-foreground">오류 및 개선사항 접수: 비누솝@톤베리</p>
    </main>
  );
}
