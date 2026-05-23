"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gavel, Landmark, Radar, Settings, UserCircle, Zap } from "lucide-react";
import { BrandLogo } from "@/src/components/brand-logo";

const tabs = [
  { label: "Radar", href: "/radar", icon: Radar },
  { label: "Courtroom", href: "/marketcourt", icon: Gavel },
  { label: "Execution", href: "/execution", icon: Zap },
  { label: "Ledger", href: "/ledger", icon: Landmark },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#161620]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-8">
            <BrandLogo />
            <nav className="hidden items-center gap-2 md:flex">
              {tabs.map((tab) => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-violet-500/20 text-violet-200"
                        : "text-zinc-300 hover:bg-violet-500/15 hover:text-violet-200"
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/create-agent" className="hidden text-right text-sm text-zinc-300 sm:block">
              Launch Agent
              <span className="block text-xs text-violet-300">Arc Testnet</span>
            </Link>
            <Settings className="text-zinc-300" />
            <UserCircle className="text-zinc-200" size={34} />
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/10 bg-[#15151d]/95 px-3 py-3 backdrop-blur-2xl md:hidden">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 text-xs font-medium transition ${
                active ? "text-violet-300" : "text-zinc-400"
              }`}
            >
              <tab.icon size={22} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
