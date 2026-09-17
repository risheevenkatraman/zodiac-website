---
version: 1
slug: "web-app-page-tsx"
primary_target: "web/app/page.tsx"
related_targets: ["web/app/layout.tsx","web/components/hero/StarfieldHero.tsx"]
---

---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/layout.tsx"]
---

## Scope
Homepage of the Next.js rebuild (route `web/app/page.tsx`); visitor mode: Persuade. Also governs the shared shell (nav, footer) and the hero starfield component.

## Audience and job
Fans, prospective players, sponsors, merch buyers arriving from X/Discord. Job: believe Zodiac is real and active, then follow (Discord), scout (Teams), or back (Store/contact).

## Chosen direction: The Celestial Atlas
Decision round key c1acbc64 (mode persuade, grain product). The roll assigned The Foil Deck; the user chose the pick card, The Celestial Atlas. Lineage: Flamsteed Atlas Coelestis / Bode Uranographia star atlases and planetarium charts.

Thesis: the org is a sky map; each team is its animal's constellation, drawn from the same stars as the hero.

First viewport: full-height black-violet sky; a GPU point cloud sampled from the Z monogram and the twelve animal marks; the cloud gathers into the monogram, headline "Written in the stars" in spaced engraved caps centered; a thin ecliptic ring carries the nav; primary action Join the Discord, secondary See the teams.

Memorable moment: on scroll the cloud re-forms from the monogram into each team's animal constellation with players as named stars.

Raises carried from the declined hand: one geometry (the ring) drives layout, art and state; the ring of twelve is the compositional arc, not a rectangular grid; role, heroes and socials stay visible beside every player, never hidden behind a reveal; the shader scales point count to GPU budget and ships a static poster fallback with reduced-motion honored.

## Constraints
Binding palette purple #6F3FA5, black, white. No invented results, follower counts, sponsors, or testimonials. Content stays data-driven (rosters churn each season).

## Resolved 2026-09-17
Dense Read surfaces (player bios, staff, store) invert to a light cream "plate" material with purple engraving, same hairline grammar. Display face: Libre Caslon Display; EB Garamond is the fallback if Caslon reads poorly at full-page scale. Hero renderer: vgpu (WebGPU), pinned; three.js only if shader results disappoint. Older mobile Safari coverage is an accepted trade.
