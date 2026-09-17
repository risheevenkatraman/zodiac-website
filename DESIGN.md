---
name: Zodiac Esports
description: A star atlas of the org; each team is its animal's constellation, drawn from the same stars as the hero.
colors:
  sky: "#0b0716"
  void: "#000000"
  ink: "#6f3fa5"
  ink-deep: "#3d225e"
  ink-lift: "#7d4dba"
  lavender: "#c9b3e8"
  starlight: "#ede9f5"
  white: "#ffffff"
  plate: "#f3eadb"
  plate-ink: "#2d2140"
  plate-muted: "#6b5b80"
  bronze: "#b2764b"
  silver: "#c9cbd6"
  gold: "#e2b84c"
  diamond: "#9fe3f0"
typography:
  display:
    fontFamily: "Libre Caslon Display, Georgia, serif"
    fontSize: "clamp(2.4rem, 6.4vw, 5.4rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "0.08em"
  headline:
    fontFamily: "Libre Caslon Display, Georgia, serif"
    fontSize: "clamp(1.9rem, 4vw, 3.4rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "0.08em"
  title:
    fontFamily: "Libre Caslon Display, Georgia, serif"
    fontSize: "clamp(1.75rem, 3.2vw, 2.6rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "0.08em"
  atlas-label:
    fontFamily: "Libre Caslon Text, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  quote:
    fontFamily: "Libre Caslon Text, Georgia, serif"
    fontSize: "clamp(1.35rem, 2vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontFeature: "\"tnum\" 1, \"kern\" 1"
  label:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.18em"
rounded:
  none: "0"
  focus: "2px"
  pill: "9999px"
spacing:
  hairline: "1px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  gutter: "20px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
  3xl: "64px"
  nav: "80px"
  section: "112px"
  section-md: "160px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.ink-lift}"
  button-primary-plate-hover:
    backgroundColor: "{colors.ink-deep}"
  button-hairline:
    backgroundColor: "transparent"
    textColor: "{colors.starlight}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  nav-pill:
    backgroundColor: "transparent"
    textColor: "{colors.starlight}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  nav-link:
    textColor: "{colors.lavender}"
    typography: "{typography.label}"
  nav-link-hover:
    textColor: "{colors.starlight}"
  plate-surface:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
  avatar:
    backgroundColor: "{colors.ink-deep}"
    rounded: "{rounded.pill}"
    size: "36px"
---

# Design System: Zodiac Esports

## Overview

**Creative North Star: "The Celestial Atlas"**

The site is a star atlas in the lineage of Flamsteed and Bode: a night sky of near-black violet on which the org is charted rather than displayed. Every team is its animal's constellation, sampled from the real team mark and joined by dotted edges; every player is a named star on that figure; the twelve houses of the zodiac sit on one hairline ring, thirty degrees apart with the Tiger at the top, and that ring is the single geometry the hero morphs into and the sections are composed around. Dense reading (the founder's words, the staff, the Stars program) inverts to a cream engraved plate with the same hairline grammar, the way an atlas turns from chart to commentary.

The material vocabulary is small and used everywhere: 1px hairlines at low opacity for every edge, four-point star glyphs as the only marker, roman numerals for plates and tiers, spaced Caslon capitals for anything that names a thing, italic Caslon for the chart's own labels, and Hanken Grotesk with tabular figures for facts and controls. There are no cards, no filled panels, no shadows beyond one ink glow under the hero's action, and no UI icon set; the only glyphs besides the star are brand marks on social links. Depth comes from tonal grounds (void pool, sky, plate) and from opacity, never from elevation.

The build is Tailwind v4 (`@theme` tokens in `web/src/app/globals.css`) with fonts loaded through `next/font`; the hero and plate figures are vgpu (WebGPU) point clouds with still-image fallbacks. The risk named in the direction contract holds: the world must stay a committed atlas and never drift into generic dark-mode space.

**Key Characteristics:**
- Night-sky ground (`sky`) with a pool of true black only under the hero cloud; cream plate for Read surfaces.
- One accent (ink purple) used as fill for the single primary action and as the colour of the star marker; text on the sky is starlight and lavender, never ink.
- Three type voices: spaced Caslon Display caps, italic Caslon Text atlas labels, Hanken Grotesk UI with tabular figures.
- Hairlines, dotted constellation edges and four-point stars are the whole material kit; no cards, no shadows, no UI icon set (brand marks appear only on social links).
- The ring of twelve is the one geometry: hero morph target, section diagram, and the order the plates are numbered in.

## Colors

A binding purple on black and white, tuned into a night sky: near-black violet ground, one ink accent, lavender for everything secondary, starlight for text, and a cream plate for reading.

### Primary
- **Ink Purple** (#6f3fa5): the binding brand purple. Fills the one primary pill on a surface (Join the Discord, Visit the store), colours every four-point star marker on the sky, tints the browser (selection, accent-color) and is the link colour on the plate. It is not a text colour on the sky.
- **Lifted Ink** (#7d4dba): the primary pill's hover on the sky. The build writes it as a literal in two places (hero and community); it is recorded here so future surfaces share it.
- **Deep Ink** (#3d225e): the primary pill's hover on the plate, the scrollbar thumb, and the ground behind roster avatars while their photo loads.

### Secondary
- **Lavender Hairline** (#c9b3e8): the chart's secondary voice. At full strength it is lead-paragraph and label text, ring and constellation labels, the focus outline and the caret; at 22% it is every hairline on the sky; at 28 to 32% it is the ring circle and the ecliptic arc; at 60% (95% when lit) it is the leader from a named star to its label. Nav links rest in lavender and rise to starlight.

### Tertiary
- **Zodiac Bronze** (#b2764b), **Zodiac Silver** (#c9cbd6), **Zodiac Gold** (#e2b84c), **Zodiac Diamond** (#9fe3f0): the four solid Stars tier swatches, 12px dots beside the tier names on the plate. Nebula, the fifth tier, is a one-off gradient from ink toward a magenta stop and is not a token.

### Neutral
- **Night Sky** (#0b0716): the page ground, the theme colour, the nav ground at 92% and the small-screen menu at 97%.
- **Hero Void** (#000000): the pool under the hero's point cloud only, a radial ellipse that dissolves into the sky at its edges.
- **Starlight** (#ede9f5): body text on the sky, section and plate headings, the active star on the ring and hero legend, the hairline button's text, the constellation's dots, its dotted edges at 80%, and the day-marker star on the calendar rail.
- **Lit Star** (#ffffff): text on the ink pill, the core and outline ring of every named star on a figure, and the label of the one lit star while a roster row is hovered.
- **Cream Plate** (#f3eadb): the Read surface ground; also the selection colour of text on the plate.
- **Plate Ink** (#2d2140): all text on the plate; at 22% it is every hairline on the plate; at 80% it is the plate's lead paragraph.
- **Plate Muted** (#6b5b80): roles, captions and roman numerals on the plate.

### Named Rules
**The Hairline Rule.** Every edge is 1px at low opacity, mixed from the surface's own secondary: lavender at 22% on the sky, plate-ink at 22% on the plate, ink at 45% when an edge must read stronger. No edge is ever a solid colour at full strength.

**The One Fill Rule.** Ink fills exactly one pill per viewport. Its companion action is a hairline pill; every other link is text that rises from lavender to starlight.

**The Real Tier Rule.** Bronze, silver, gold and diamond appear only beside a tier that exists in the Stars program. They are never decoration or state colours.

**The Sky, Not Space Rule.** The ground is the violet sky, never neutral black or grey. True black exists only as the pool beneath the hero cloud, and it fades back into the sky before the page begins.

## Typography

**Display Font:** Libre Caslon Display (with Georgia, serif)
**Body Font:** Hanken Grotesk (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** Libre Caslon Text italic for atlas labels; Hanken Grotesk with `tnum` for figures. No monospace.

**Character:** An engraver's capitals over a modern chart hand. Caslon Display in spaced uppercase names things the way a plate title does; Caslon Text italic is the atlas's own annotation voice (houses, tabula numbers, star names, numerals); Hanken Grotesk carries facts, roles and controls in small tracked caps with tabular figures, so the type reads as one instrument with three registers rather than a pairing.

### Hierarchy
- **Display** (400, clamp(2.4rem, 6.4vw, 5.4rem), 1.02, uppercase, 0.08em): the hero headline "Written in the stars" only. Two lines, left-set, balanced.
- **Headline** (400, clamp(1.9rem, 4vw, 3.4rem), 1.02, uppercase, 0.08em): every section heading after its opening hairline. The community close steps up to clamp(2rem, 5vw, 4.2rem) once.
- **Title** (400, clamp(1.75rem, 3.2vw, 2.6rem), 1.02, uppercase, 0.08em): team names on their plates. The same face at fixed sizes names the footer wordmark (1.5rem), the Stars tiers (1.25rem) and the small-screen menu links (1.5rem).
- **Atlas Label** (400 italic, 1rem in HTML; 12px ring labels and 11px star names in SVG): the house line under a team title, the "Tab. N" caption under a figure, "The staff" heading, roman numerals beside tiers, and every star and ring label. Always lavender on the sky, plate-muted on the plate.
- **Quote** (400 upright, 1.35rem rising to 1.5rem at md, 1.45): the founder's words on the plate; the one place Caslon Text is set upright at reading size.
- **Body** (400, 1rem with the hero lead at 1.125rem from sm, 1.5, `tnum`): lead paragraphs in lavender on the sky, plate-ink at 80% on the plate; capped at 38 to 46ch. Names in rows are medium (500) starlight; a fixture's "Team vs Opponent" line is 1.125rem starlight on the calendar timeline and 1rem on a plate, with "vs" at lavender-70%. Small facts (signature hero, a fixture's game and league at lavender-75%) are 0.875rem; footer legal is 0.75rem at 70% lavender.
- **Label** (500, 0.75rem, 1.2, uppercase, 0.18em): every control and metadata slug: buttons, nav links, roles, games, the hero legend, the plate's links, and the date column of every fixture ("Sat Sep 20", or "Sep 20" on a plate). Lavender at rest (80% for roles and dates, 60% for an open slot's role), starlight when primary or hovered.

### Named Rules
**The Spaced Caps Rule.** Caslon Display is only ever set uppercase at 0.08em tracking with 1.02 leading. It is never set in mixed case and never below 1.25rem.

**The Atlas Voice Rule.** Italic Caslon Text is the chart's annotation, not the UI's. It names houses, plates, stars and numerals and sits beneath or beside the thing it names; it never labels a control and is never used as an eyebrow above a heading.

**The Tabular Rule.** Every number on the site is a tabular figure (`tnum` is on at the body). Season numbers, player counts and dates align.

## Layout

One container of 1280px, centred, with 20px side gutters that widen to 32px from 640px. Sections stack vertically with 112px of padding above and below, growing to 160px from 768px (the Stars block on the plate uses 96px to 128px); the footer sits on 56px. The fixed nav is 80px tall, and every anchor target scrolls to 80px below the top (team plates to 112px) so the ecliptic never covers a heading.

Every section opens with a full-width hairline rule, then 32px later a display-caps headline and a lavender lead paragraph; the first section's rule draws in from the left as it enters. Section bodies are two-column grids from 768px with deliberately unequal fractions (1fr / 320px for the houses, 1fr / 1.4fr for the calendar, 1.1fr / 1fr for the founder, 1.2fr / 1fr for the close) and 40px gaps; team plates are 320px / 1fr / 1fr with 48px gaps. Below 768px everything is a single column.

Lists are hairline stacks: a grid with 1px gaps where each row carries its own hairline top and 16 to 20px of vertical padding, names and roles set on a baseline with 12px between them, actions pushed to the far right. Roster rows use 12px gaps and hairline bottoms. Star-marked links keep 8px between glyph and text; button groups keep 12px.

Fixtures are dated rows on the same stack. The calendar timeline hangs from a left hairline rail with 32px of inset: each row is a 6.5rem caps date column and a 1fr body with a 20px gap and 16px of vertical padding; the first row of a new day carries a hairline top and an 11px starlight star on the rail (2.35rem left of the row, 20px down), and later rows of the same day leave the date column empty. A plate's own fixture list is the compact form: a 3.25rem date column, 16px gap, 12px vertical padding, at most four rows, 20px under the schedule link.

The hero is a pinned scene: the section is 175svh tall and its viewport is sticky at 100svh. The copy sits left in a 30 to 34rem column, vertically centred from 768px and bottom-aligned above the legend on small screens; the point cloud is offset right of it. A five-item legend of the rosters rests on the horizon under a hairline, spread between the container's edges from 768px and centred below it.

The house ring diagram is a 288px square (320px from 768px) whose twelve positions sit on a 118-unit radius, thirty degrees apart, counter-clockwise from the top: Tigers at 0, Ox at 1, Goats at 4, Piggies at 8, the flagship at the centre. Plate figures share one 380 x 288 unit box between their WebGPU canvas and their SVG constellation, pulled 32px into the left gutter so the figure sits proud of the text column.

**The Rule-First Rule.** A section begins with a hairline, not a heading. The heading follows 32px beneath it.

**The One Geometry Rule.** New arrangements of the teams derive from the ring: twelve positions, thirty degrees apart, Tiger at the top, counter-clockwise, flagship at the centre. Do not lay the houses out on a grid.

## Elevation & Depth

The system is flat. Depth is tonal and atmospheric: the hero's true-black pool sits inside the violet sky, the sky sits under the ecliptic's 92% ground, and the cream plate reads as a different material rather than a raised one. Within a surface, hierarchy is carried by opacity (hairlines at 22%, quiet ring dots at 50%, dimmed labels at 45%) and by the lit/unlit state of stars, never by box-shadow. The nav has no backdrop blur; its ground is a solid-enough sky clipped to an ellipse, because blurring an animating canvas every frame is the most expensive thing a fixed bar can do.

### Shadow Vocabulary
- **Ink glow** (`box-shadow: 0 12px 40px -12px rgba(111,63,165,0.9)`): the hero's primary pill only, a soft pool of ink under the first action. It does not travel to other buttons.

### Named Rules
**The Flat Sky Rule.** Nothing casts a shadow except the hero's primary action. Lift is expressed as a brighter hairline, a lit star, or a colour rising toward starlight.

## Shapes

Two shapes only: the pill and the square. Buttons, nav pills, avatars (36 to 48px), tier swatches (12px), the nav's hover dot (4px) and the ring's stars are fully round; everything else is square-cornered with a hairline edge. The focus ring is a 2px lavender outline offset 4px with a 2px radius (ink on the plate); the scrollbar thumb is the only other rounded element (8px, deep ink, inset 3px on a sky track). The nav's ground is clipped to a single ellipse whose lower edge bows across the full width, traced by a 1px lavender arc at 32%: the ecliptic. Stars are four-point glyphs (a single path in a 10-unit box) or soft circles; a named star on a figure is three concentric circles (a sky backing disc, a white core, a white outline ring) so it reads above the dot cloud; constellation edges are dotted (1.4px, dash 1.5 3.5, round caps, starlight at 80%); brand marks on social links are single-path simple-icons glyphs in a 24-unit box at 12 to 14px; an open roster slot is a dashed hairline circle where the avatar would be.

**The Pill-or-Square Rule.** No intermediate radii. A thing is either a full pill (actions, avatars, dots) or a hairlined rectangle (rows, rules, sections).

## Components

### Buttons
- **Shape:** full pill (9999px), 24px horizontal and 14px vertical padding, label type (0.75rem caps, 0.18em).
- **Primary:** ink fill, white text, no border. On the sky it hovers to lifted ink (#7d4dba); on the plate it hovers to deep ink. The hero's instance alone carries the ink glow. One per viewport.
- **Hairline (secondary):** transparent, starlight text, 1px lavender-22% border; the border rises to full lavender on hover. In the nav it is compressed to 16px by 8px and also tints to ink at 25% on hover.
- **Focus:** 2px lavender outline, 4px offset, 2px radius (ink outline on the plate). Colour transitions run at the default 150ms.
- **Star link:** a caps link led by an 8px ink star glyph with 8px gap (Match schedule, footer links). Lavender rising to starlight, or starlight when it is the row's primary link.

### Cards / Containers
- **Corner Style:** none. The system has no cards.
- **Background:** the surface itself (sky or plate).
- **Shadow Strategy:** none (see Elevation).
- **Border:** a hairline top per row, rows stacked with 1px gaps; roster rows use hairline bottoms.
- **Internal Padding:** 16 to 20px vertical, no horizontal inset.
- **Row anatomy:** 36px round avatar on deep ink (48px for the founder, 40px for staff), name in medium starlight, role in caps lavender-80%, optional signature hero/agent as a 20px round icon with its name at 0.875rem, and at the far right the player's first social as a 14px brand glyph (lavender rising to starlight, labelled for assistive tech). An open slot shows a dashed hairline circle, "Open slot" and the role at lavender-60%. Hovering or focusing a roster row lights its star on the figure and turns the name white.

### Inputs / Fields
Not present in the build. The browser surfaces are set for when they arrive: caret lavender, accent-color ink, selection ink on white (ink on cream on the plate), `color-scheme: dark` on the sky and `light` on the plate.

### Navigation
- **Style:** the ecliptic. A fixed 80px header whose ground is sky at 92% clipped to an ellipse (115% wide, 100% tall, centred at the top edge), traced by a 1px lavender arc at 32%. No backdrop blur. Brand at left is the 36px monogram plus "Zodiac Esports" in caps (hidden below 640px). Links are caps in lavender with 28px between them; on hover they turn starlight and a 4px lavender dot fades in 12px to their left. A hairline Discord pill sits at the right.
- **Small screens (below 768px):** the links collapse to a hairline "Menu" / "Close" pill. The panel is fixed from 80px to the bottom on sky at 97%, 32px top padding, each link a hairline-bottomed row of display caps at 1.5rem with an ink star glyph, 20px of vertical padding, and an ink pill for Discord beneath. Escape closes it.
- **Footer:** a hairline-topped 1.4fr / 1fr / 1fr grid at 56px padding: display-caps wordmark at 1.5rem with a lavender line, star-led caps links, social links led by a 12px brand glyph, then a second hairline and the legal line at 0.75rem lavender-70%.

### Social Icon
The one glyph family besides the star: simple-icons brand marks (X, Twitch, YouTube, TikTok, Instagram, Discord) drawn in `currentColor` at 14px in roster and staff rows and 12px in the footer, resolved from the data's social label. They mark social links only and inherit the link's lavender-to-starlight colour; a label with no known brand falls back to its name in caps. They are never used as UI icons.

### Starfield Hero (signature)
The first viewport: a vgpu point cloud sampled from the real Z monogram, drawn as soft additive points whose colour is the mark's own pixel lifted toward starlight for faint stars, over a radial pool of void that dissolves into the sky. The point budget scales with pixel count (about one star per 90 device pixels, capped at 13,000 on desktop and 5,500 below 640px, DPR clamped to 1.5); the pointer stirs the cloud; the canvas fades in over 700ms when ready; under reduced motion it renders one frame; without WebGPU it falls back to the still monogram at 60%. As the visitor scrolls the pinned 175svh section, the cloud re-forms into the ring of twelve while the headline fades over the first 55% of travel and the roster legend returns after 50%. In the ring, a small monogram (14% of the stars, scaled to 0.3) holds the centre and the four active houses take their real team-logo colours as shader literals (Tigers orange, Ox blue, Goats silver, Piggies pink; approximately #ff7a00, #0a6bff, #c9ccd6, #ff3d8a), the quiet houses a pale violet at 55% weight. Those four colours live in the hero shader only and are not CSS tokens.

### Team Plate (signature)
One atlas plate per roster in a hairline-topped row (48px vertical padding): the figure at left, the heading block in the middle, the roster as the figure's legend at right. The figure is the mark rendered as a breathing 1,500-star instanced dot cloud on a shared WebGPU device, drawn additively with the same star fragment as the hero and keeping the mark's own pixel colour (lifted only 2% toward white); the still mark at 80% is the fallback. An SVG constellation sits over it: 22 stars (30 for the flagship) sampled from the same mark as starlight dots (r 1.2 to 3.0, 80 to 100% opacity), joined by nearest-neighbour and spanning-tree edges in the dotted starlight stroke, and as many named stars as the roster has players, chosen farthest-point-first so labels spread around the figure. A named star is built to sit above the cloud: a sky-coloured backing disc (r 6, 85%), a white core (r 3.8) and a white outline ring (r 7.5 at 45%, 0.9px); it leads out along its radial on a 0.9px lavender-60% hairline to an italic 11px label, and labels whose boxes collide are pushed apart vertically. Hovering a label or its roster row lights the star (disc r 7.5, core r 5, ring r 9.5 at 70%, leader at 95%, label white) and dims the other labels to 45%. The caption "Tab. N" in italic sits under the figure; the heading block is the team name in title caps, the house in italic Caslon on the line beneath, facts in lavender (game, player count, season), a star-led caps link to the FACEIT schedule, and beneath it the team's next fixtures (up to four) as compact dated rows: a 3.25rem caps date, "vs Opponent" in starlight, the league at 0.875rem lavender-75%.

### Calendar Timeline (signature)
The Matches section's right column: every synced fixture in date order on a single vertical hairline rail. Rows are 6.5rem caps date / 1fr body; the first fixture of each day opens with a hairline top and an 11px starlight star set on the rail, later fixtures that day leave the date blank, so the rail reads as a chart of nights rather than a table. The body line is "Team vs Opponent" at 1.125rem starlight with "vs" at lavender-70%, then "Game · League" at 0.875rem lavender-75%. With no fixtures the list holds a single lavender-75% line. The left column carries the section lead and star-led caps links to each roster's FACEIT page.

### House Ring (signature)
The section diagram and the hero's morph target: a lavender-28% hairline circle with twelve lavender-50% 2px dots at thirty-degree intervals, the Tiger at the top, counter-clockwise; each active house is a 4.5px starlight star (6px on hover) linked to its plate, with an italic 12px "numeral · name" label pushed outward along its radius (lavender, starlight on hover); the flagship's star sits at the centre with its label below.

### Plate Surface
Read surfaces invert to the cream plate: plate-ink text, `color-scheme: light`, hairlines at plate-ink 22%, roles and numerals in plate-muted italic or caps, ink as the link colour, and the primary pill hovering to deep ink. Tiers are hairline rows with a roman numeral (32px column, italic muted), a 12px round swatch, and the tier name in display caps at 1.25rem.

## Do's and Don'ts

### Do:
- **Do** open every section with a hairline rule and set the headline 32px beneath it in Caslon Display caps at 0.08em.
- **Do** separate content with 1px hairlines mixed from the surface's secondary (lavender 22% on sky, plate-ink 22% on plate) and stack rows with 1px gaps.
- **Do** use the four-point star glyph (8 to 10px, ink on sky, starlight on the hero legend) as the marker for any list or star-led link.
- **Do** put one ink pill per viewport and pair it with a hairline pill; let every other link be text rising from lavender to starlight.
- **Do** write the chart's own labels (house names, "Tab. N", numerals, star names) in italic Caslon Text, placed beneath or beside what they name.
- **Do** invert dense reading to the cream plate and keep the hairline grammar, ink links and display caps intact there.
- **Do** derive any arrangement of the teams from the ring: twelve positions, thirty degrees apart, Tiger at the top, flagship at the centre.
- **Do** keep numbers tabular and roman numerals for plates and tiers.
- **Do** set dated rows with a caps date column (6.5rem on the calendar rail, 3.25rem on a plate) and mark each new day on a rail with a starlight star.
- **Do** honour reduced motion: still starfield, no rule-draw, no smooth scroll.

### Don't:
- **Don't** introduce cards, filled panels, or intermediate corner radii; the only shapes are the pill and the hairlined rectangle.
- **Don't** cast shadows; the hero's ink glow is the single exception and does not travel.
- **Don't** blur the nav or any fixed surface over the canvas; use the clipped sky ground.
- **Don't** set ink as text on the sky, or set Caslon Display in mixed case or below 1.25rem.
- **Don't** add a UI icon set; the star glyph, the dotted edge and the hairline are the kit, and brand marks appear only on social links at 12 to 14px in currentColor.
- **Don't** use the tier colours or the four team-logo colours outside a real tier or the hero ring.
- **Don't** ground a surface on neutral black or grey; the sky is violet, and true black belongs only to the hero pool.
- **Don't** place an eyebrow or kicker above a heading; the house line lives under the team title.
