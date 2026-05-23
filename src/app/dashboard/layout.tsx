import { DashboardNav } from "@/src/components/dashboard-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#15151d] pb-24 text-white md:pb-0">
      <DashboardNav />
      <div className="mx-auto max-w-[1440px] space-y-10 px-5 py-8 md:px-8 md:py-12">
        {children}
      </div>
    </main>
  );
}
