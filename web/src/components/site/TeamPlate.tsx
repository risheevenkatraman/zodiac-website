"use client";

import { useState } from "react";
import Image from "next/image";
import { Constellation } from "./Constellation";
import { PlateFigure } from "./PlateFigure";
import { StarGlyph } from "./StarGlyph";
import { SocialIcon } from "./SocialIcon";

export type PlateRoster = {
  id: string;
  name: string;
  role: string;
  image: string;
  open: boolean;
  signature?: { name: string; image: string };
  social?: { label: string; url: string };
};

export type PlateTeam = {
  slug: string;
  name: string;
  house: string;
  numeral: string;
  game: string;
  mark: string;
  season?: number;
  scheduleUrl?: string;
  roster: PlateRoster[];
  matches: { month: string; day: string; weekday: string; opponent: string; league: string }[];
};

/** One atlas plate: the team's figure with its players as named stars, and the roster as its legend. */
export function TeamPlate({ team, seed }: { team: PlateTeam; seed: number }) {
  const [active, setActive] = useState<number | null>(null);
  const named = team.roster.filter((p) => !p.open);
  const labels = named.map((p) => p.name);

  return (
    <li id={`team-${team.slug}`} className="hairline grid scroll-mt-28 gap-8 border-t py-12 md:grid-cols-[320px_1fr_1fr] md:gap-12">
      <figure className="text-starlight">
        <div className="relative -ml-8 aspect-[380/288] w-[340px] max-w-full">
          <PlateFigure src={team.mark} className="absolute inset-0" />
          <Constellation
            src={team.mark}
            className="absolute inset-0 h-full w-full"
            seed={seed}
            stars={team.slug === "zodiac" ? 30 : 22}
            labels={labels}
            active={active}
            onHover={setActive}
          />
        </div>
        <figcaption className="font-text italic text-lavender">Tab. {team.numeral}</figcaption>
      </figure>
      <div>
        <h3 className="display-caps text-[clamp(1.75rem,3.2vw,2.6rem)]">{team.name}</h3>
        <p className="font-text mt-1 italic text-lavender">{team.house}</p>
        <p className="mt-4 text-lavender">
          {team.game} · {named.length} players
          {team.season ? ` · FACEIT League Season ${team.season}` : ""}
        </p>
        {team.scheduleUrl && (
          <a href={team.scheduleUrl} target="_blank" rel="noreferrer" className="caps mt-6 inline-flex items-center gap-2 text-starlight">
            <StarGlyph size={8} className="text-ink" /> Match schedule
          </a>
        )}
        {team.scheduleUrl && team.matches.length === 0 && (
          <p className="hairline caps mt-5 border-t pt-3 text-lavender/70">No fixtures scheduled yet</p>
        )}
        {team.matches.length > 0 && (
          <ol className="mt-5 grid gap-px">
            {team.matches.map((m, i) => (
              <li key={i} className="hairline grid grid-cols-[3.25rem_1fr] items-baseline gap-4 border-t py-3">
                <span className="caps text-lavender/80">
                  {m.month} {m.day}
                </span>
                <span className="min-w-0">
                  <span className="block text-starlight">vs {m.opponent}</span>
                  <span className="block text-sm text-lavender/75">{m.league}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <ul className="grid content-start gap-3" onMouseLeave={() => setActive(null)}>
        {team.roster.map((p) => {
          const li = named.findIndex((n) => n.id === p.id);
          const lit = li >= 0 && active === li;
          return (
            <li
              key={p.id}
              className={`hairline flex items-center gap-4 border-b pb-3 transition-colors last:border-b-0 ${lit ? "text-white" : ""}`}
              onMouseEnter={() => setActive(li >= 0 ? li : null)}
              onFocus={() => setActive(li >= 0 ? li : null)}
            >
              {p.open ? (
                <>
                  <span className="hairline h-9 w-9 shrink-0 rounded-full border border-dashed" aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 items-baseline gap-3">
                    <span className="caps text-lavender/80">Open slot</span>
                    <span className="caps text-lavender/60">{p.role}</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-ink-deep">
                    <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                  <span className="flex min-w-0 flex-1 items-baseline gap-3">
                    <span className={`truncate font-medium ${lit ? "text-white" : "text-starlight"}`}>{p.name}</span>
                    <span className="caps text-lavender/80">{p.role}</span>
                  </span>
                  {p.signature?.name && (
                    <span className="flex items-center gap-2 text-sm text-lavender" title={p.signature.name}>
                      <Image src={p.signature.image} alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                      <span className="hidden sm:inline">{p.signature.name}</span>
                    </span>
                  )}
                  {p.social && (
                    <a href={p.social.url} target="_blank" rel="noreferrer" className="text-lavender no-underline hover:text-starlight" aria-label={`${p.name} on ${p.social.label}`}>
                      <SocialIcon label={p.social.label} size={14} />
                    </a>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </li>
  );
}
