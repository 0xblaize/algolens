import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="AgoraLens home">
      <span className="grid size-9 place-items-center overflow-hidden rounded-2xl bg-violet-500/20 ring-1 ring-violet-400/35">
        <Image
          src="/logo.jpg"
          alt=""
          width={36}
          height={36}
          className="size-full object-cover"
          priority
        />
      </span>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight text-white">
          Agora<span className="text-violet-300">Lens</span>
        </span>
      )}
    </Link>
  );
}
