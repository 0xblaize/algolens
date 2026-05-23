import Link from "next/link";
import { navItems } from "@/src/data/marketing";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#111119]">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-6 py-12 sm:px-10 md:grid-cols-[1fr_2fr] lg:px-16">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            AI market integrity agent for prediction markets. Auditing before capital moves.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <FooterColumn title="Platform" items={navItems.map((item) => [item.label, item.href])} />
          <FooterColumn
            title="Resources"
            items={[
              ["Documentation", "/dashboard"],
              ["Arc Protocol", "/dashboard/execution"],
              ["Market Integrity Paper", "/dashboard/ledger"],
            ]}
          />
          <FooterColumn
            title="Connect"
            items={[
              ["Twitter", "/"],
              ["GitHub", "/"],
              ["Explorer", "/dashboard/ledger"],
            ]}
          />
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-zinc-500">
        © 2026 AgoraLens. AI-driven integrity for Web3 markets.
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-4 grid gap-2">
        {items.map(([label, href]) => (
          <Link key={label} href={href} className="text-sm text-zinc-400 hover:text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
