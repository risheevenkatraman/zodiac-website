import Link from "next/link";
import Image from "next/image";
import { discordUrl, storeUrl } from "@/lib/data";
import { NavMenu } from "./NavMenu";

const links = [
  { href: "/#teams", label: "Teams" },
  { href: "/#matches", label: "Matches" },
  { href: "/#stars", label: "Stars" },
  { href: storeUrl, label: "Store", external: true },
  { href: "/#community", label: "Community" },
];

/** The ecliptic: a thin arc across the top of the sky carrying the nav as star labels. */
export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-20">
      {/*
        The ecliptic: the header's ground is one ellipse whose lower edge bows across the
        full width; the sky shows through beneath the arc. No backdrop blur: blurring an
        animating canvas every frame is the single most expensive thing a fixed bar can do.
      */}
      <div
        className="absolute inset-0 -z-10 bg-sky/92"
        style={{ clipPath: "ellipse(115% 100% at 50% 0%)" }}
        aria-hidden="true"
      />
      <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-hidden" aria-hidden="true">
        <ellipse cx="50%" cy="0" rx="115%" ry="100%" fill="none" stroke="var(--color-lavender)" strokeOpacity="0.32" strokeWidth="1" />
      </svg>
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-starlight no-underline" aria-label="Zodiac Esports, home">
          <Image src="/assets/zodiac-logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" priority />
          <span className="caps hidden sm:inline">Zodiac Esports</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noreferrer" : undefined}
              className="caps group relative text-lavender no-underline hover:text-starlight"
            >
              <span className="absolute -left-3 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-lavender opacity-0 transition-opacity group-hover:opacity-100" />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
            className="caps hairline hidden rounded-full border px-4 py-2 text-starlight no-underline transition-colors hover:border-lavender hover:bg-ink/25 sm:inline-block"
          >
            Join the Discord
          </a>
          <NavMenu links={links} discordUrl={discordUrl} />
        </div>
      </div>
    </header>
  );
}
