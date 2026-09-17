# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) with Tailwind CSS, deployed to Vercel. This is a design-led
prototype of the redesign; the existing vanilla HTML/CSS/JS site, its Python build
scripts, Decap CMS, FACEIT sync, and the Shopify/AWS rewards backend are reference
material, not integration requirements. Hero effect: **vgpu** (WebGPU) is the pinned renderer for the shader-driven
starfield; the user accepts weaker coverage on older mobile Safari as a
trade for performance. three.js is the fallback only if the vgpu shader
results disappoint. The Next.js app lives in `web/`; the vanilla site at the
repo root stays as reference material.

## Users

Four confirmed audiences, all served by the public site:

- **Fans and community** — follow rosters, match times, results, announcements; join the Discord.
- **Prospective players** — scout the org, understand the team ladder, find how to get involved.
- **Sponsors and partners** — judge legitimacy, reach, and professionalism before backing the org.
- **Merch buyers** — shop the store and use the Stars loyalty program.

No audience has been ranked above the others. The homepage must be legible to all four.

## Product Purpose

Zodiac Esports (est. 2024) is a grassroots, community-driven esports organization
competing in Overwatch and VALORANT. The site is the org's public home: it presents
the teams and people, keeps fans current on matches and news, sells merchandise,
and gives the community a place to gather. Success is a visitor believing Zodiac is
real, active, and worth following, joining, or backing.

## Positioning

Two confirmed differentiators:

1. **Community-first culture.** Discord, events, and fan participation matter as
   much as results. The org was founded by an ex-player/manager to "create a better
   environment for gamers, managers, coaches and the scene in general."
2. **Multi-team development ladder.** Four Overwatch rosters (Zodiac, Piggies, Ox,
   Goats) plus VALORANT (Tigers) live under one org, so players can move up as they
   improve. Most grassroots orgs field one roster per title.

Not claimed: pro-tier results, salaries, or a large fanbase. Do not imply them.

## Operating Context

- Overwatch teams compete in FACEIT leagues (season 10 at time of writing); match
  schedules come from the FACEIT Data API.
- Rosters change between seasons. Player and staff profiles are edited by
  non-technical staff (currently via Decap CMS forms), so content structures must
  stay simple and data-driven.
- Merchandise is sold through Shopify; the **Stars** program awards points on
  purchases with lifetime tiers: Zodiac Bronze, Silver, Gold, Diamond, Nebula.
- Fans primarily arrive from X/Twitter (@zodiacsesport) and Discord.

## Capabilities and Constraints

Confirmed site sections: Home, Teams (per-team roster pages), Players (individual
profiles), Staff, Store, Socials, Account & Stars.

Roster data model per player: name, role (Overwatch: Tank/Damage/Support; VALORANT:
Controller/Duelist/Initiator/Flex/Sentinel), introduction, socials, profile photo,
signature heroes/agents (Blizzard and Riot icon assets used non-commercially with
required attribution in the footer).

Terminology: "Zodiac Esports" (not "eSports"); "Stars" (loyalty points); team names
are zodiac animals; the flagship Overwatch roster is simply "Zodiac".

Prototype scope (confirmed): design and front-end only. Store, account, and CMS
flows can be represented with real content and static data; live commerce, auth,
and rewards are out of scope.

Open: whether the redesign later replaces production on Amplify or moves hosting to
Vercel permanently.

## Brand Commitments

- **Name/motto:** Zodiac Esports — "written in the stars".
- **Colors (binding):** purple `#6F3FA5`, black, white.
- **Marks:** `assets/zodiac-logo.svg` / `.png` (the Z monogram), `assets/zodiac-banner.png`
  (Z monogram ringed by the twelve zodiac animal marks, "EST. 2024"), per-team logos
  for Goats, Ox, Piggies, Tigers in `assets/`. The twelve-animal ring is the team
  naming system and a core identity device.
- **Hero concept (volunteered, binding):** full-viewport-height hero, headline
  centered, with a 3D starfield / point-cloud effect behind it built from the logo
  and team marks.
- Existing look (cream/lavender gradient, rounded cards, Inter) is the outgoing
  design and is evidence only, not authority.

## Evidence on Hand

- Real rosters and bios: `data/players.json` (26 players across 5 teams).
- Real staff and bios: `data/staff.json` (6 staff, including founder story).
- Real profile photos: `assets/*-pfp.*`; hero/agent icons: `assets/*_Hero.webp`, `assets/*_icon.webp`.
- Team logos: `assets/goats-logo.png`, `ox-logo.png`, `piggies-logo.png`, `tigers-logo.png`.
- Socials: X @zodiacsesport, Discord invite in `data/site.json`.
- Match sources: `data/match_sources.json` (FACEIT team IDs and schedule URLs).
- Store: Shopify domain exists; no product photography in the repo.
- Absent, do not fabricate: match results/records, viewer or follower counts,
  sponsor logos, testimonials, press coverage, tournament placements.

## Product Principles

1. **Prove the org is real before asking for anything.** Real names, faces, and
   schedules carry credibility; the site should lead with them.
2. **One org, many teams.** The ladder is a feature; every roster gets equal
   structural treatment, and the animal identities are celebrated, not flattened.
3. **Community is the product.** Paths to Discord, events, and participation are
   first-class, not footer links.
4. **Content is edited by non-engineers.** Structures stay data-driven and simple
   enough to survive roster churn every season.
5. **Written in the stars is a promise about ambition.** The site should feel like
   a place players want to be part of, without claiming results that don't exist yet.
