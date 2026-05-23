import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/src/components/brand-logo";
import { CreateAgentForm } from "@/src/features/onboarding/CreateAgentForm";
import { getCircleConfigState } from "@/src/lib/circle/config";

export default function CreateAgentPage() {
  const circle = getCircleConfigState();

  return (
    <main className="min-h-screen bg-[#101018] px-5 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <BrandLogo />
          <Link href="/" className="btn-secondary">
            <ArrowLeft size={16} />
            Landing
          </Link>
        </div>
        <div className="py-12">
          <CreateAgentForm circleStatus={circle.status} circleMissing={circle.missing} />
        </div>
      </div>
    </main>
  );
}
