"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { navItems } from "@/src/data/marketing";
import { BrandLogo } from "./brand-logo";

export function SiteNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#12121b]/88 backdrop-blur-2xl">
      <nav className="flex w-full items-center justify-between px-6 py-[13px] lg:px-8">
        <BrandLogo />
        <div className="ml-auto hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[13px] font-semibold text-zinc-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-8 hidden md:block">
          <Link
            className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-[18px] py-[9px] text-[13px] font-semibold text-white shadow-[0_10px_26px_rgba(124,58,237,0.3)]"
            href="/create-agent"
          >
            Launch Agent
          </Link>
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-white/10 bg-[#12121b] px-6 py-4 shadow-2xl md:hidden sm:px-10">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-base font-medium text-zinc-200 hover:bg-white/[0.05]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/create-agent"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(124,58,237,0.36)] transition hover:scale-[1.01]"
            >
              Launch Agent
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
