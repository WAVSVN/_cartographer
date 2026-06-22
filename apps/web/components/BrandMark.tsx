import Link from "next/link";

export default function BrandMark() {
  return (
    <Link href="/" className="min-w-0 shrink-0">
      <p className="truncate font-brand text-[0.95rem] lowercase tracking-widest text-ops-chrome transition hover:text-ops-accent sm:text-[1.05rem]">
        grid ops command
      </p>
    </Link>
  );
}
