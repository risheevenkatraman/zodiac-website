"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { StarfieldHero } from "./StarfieldHero";
import { StarGlyph } from "@/components/site/StarGlyph";

type TeamLegend = { name: string; slug: string; game: string };

/**
 * The first viewport, pinned: as the visitor scrolls, the sky re-forms from the
 * monogram into the ring of twelve while the headline gives way to the legend.
 */
export function HeroScene({ teams, discordUrl }: { teams: TeamLegend[]; discordUrl: string }) {
  const progressRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      progressRef.current = p;
      // Style writes go straight to the DOM: a React render per scroll tick is wasted work.
      const headline = 1 - Math.min(1, p / 0.55);
      const legend = Math.max(Math.max(0, (p - 0.5) / 0.4), 1 - p * 2.5);
      if (poolRef.current) poolRef.current.style.opacity = String(headline);
      if (copyRef.current) {
        copyRef.current.style.opacity = String(headline);
        copyRef.current.style.transform = `translateY(${p * -24}px)`;
      }
      if (legendRef.current) legendRef.current.style.opacity = String(legend);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[175svh] bg-sky" aria-label="Written in the stars">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* The void pools under the cloud and dissolves into the sky at the edges, so the hero ends where the page begins. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 78% 72% at 50% 46%, #000000 0%, #000000 30%, var(--color-sky) 100%)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{ background: "linear-gradient(to bottom, transparent, var(--color-sky))" }}
          aria-hidden="true"
        />
        <StarfieldHero progressRef={progressRef} className="absolute inset-0" />
        <div
          ref={copyRef}
          className="relative z-10 mx-auto flex h-full max-w-[1280px] flex-col justify-end px-5 pb-32 sm:px-8 md:justify-center md:pb-0"
        >
          <div className="max-w-[30rem] md:max-w-[34rem]">
            <h1 className="display-caps text-[clamp(2.4rem,6.4vw,5.4rem)] text-starlight">
              Written in
              <br />
              the stars
            </h1>
            <p className="mt-6 max-w-[40ch] text-base text-lavender sm:text-lg">
              Zodiac Esports is a grassroots organization fielding five rosters across Overwatch and VALORANT, built by players since 2024.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={discordUrl}
                target="_blank"
                rel="noreferrer"
                className="caps rounded-full bg-ink px-6 py-3.5 text-white no-underline shadow-[0_12px_40px_-12px_rgba(111,63,165,0.9)] transition-colors hover:bg-[#7d4dba]"
              >
                Join the Discord
              </a>
              <Link href="#teams" className="caps hairline rounded-full border px-6 py-3.5 text-starlight no-underline transition-colors hover:border-lavender">
                See the teams
              </Link>
            </div>
          </div>
        </div>

        {/* The legend on the horizon: five rosters, twelve houses. */}
        <div ref={legendRef} className="absolute inset-x-0 bottom-0 z-10 px-5 pb-8 sm:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="hairline border-t pt-5">
              <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:justify-between">
                {teams.map((t) => (
                  <li key={t.slug}>
                    <Link href={`#team-${t.slug}`} className="caps flex items-center gap-2 text-lavender no-underline hover:text-starlight">
                      <StarGlyph size={9} className="text-starlight" />
                      {t.name}
                      <span className="hidden text-lavender/55 sm:inline">{t.game}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
