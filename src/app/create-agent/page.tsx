import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/src/components/brand-logo";
import { CreateAgentForm } from "@/src/features/onboarding/CreateAgentForm";
import { getCircleConfigState } from "@/src/lib/circle/config";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function CreateAgentPage({ searchParams }: Props) {
  const circle = getCircleConfigState();
  const { next } = await searchParams;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#101018] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <BrandLogo />
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft size={15} />
            Home
          </Link>
        </div>

        {/* Onboarding form */}
        <div className="py-10 md:py-16">
          <Suspense>
            <CreateAgentForm
              circleStatus={circle.status}
              nextPath={next}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
