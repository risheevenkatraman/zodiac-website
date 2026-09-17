# Animation plans

Written by `improve-animations` against commit `176c2de` (branch `lucas/redesign`). Each plan is self-contained; run it with `improve-animations execute <plan>` or hand it to any agent.

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Ease the staff bio accordion open and closed](001-staff-accordion-open-close.md) | MEDIUM | DONE |
| 002 | [Fade the mobile menu panel in and out on the same edge](002-mobile-menu-panel-transition.md) | MEDIUM | DONE |
| 003 | [Fade each plate dot cloud in on its first frame](003-plate-figure-fade-in.md) | LOW | DONE |
| 004 | [Add press feedback to the pill buttons](004-pill-press-feedback.md) | LOW | DONE |

## Recommended order

1. **001** — highest leverage; the only click-to-read interaction on the About plate, and it snaps today.
2. **002** — every phone visitor's first interaction.
3. **004** — small, touches five files, best done before 002 lands if both are in flight, since both edit `NavMenu.tsx` (see dependencies).
4. **003** — cohesion with the hero; confirm the pop is visible on a throttled cold load before spending the effort.

## Dependencies

- 002 and 004 both edit `web/src/components/site/NavMenu.tsx` (002 changes the panel `<div>` at line 30, 004 changes classNames at lines 26 and 49). Apply them sequentially and re-check line numbers after the first lands; the excerpts in each plan are the source of truth, not the line numbers.
- 001, 002, and 004 each append a block to the end of `web/src/app/globals.css`. Order does not matter; append each block after whatever is last at the time.
- 003 is independent.

## Shared conventions

- The only easing token is `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` (`web/src/app/globals.css:26`). No plan adds a token.
- Every motion block carries a `@media (prefers-reduced-motion: reduce)` override that softens rather than removes feedback.
- Plan 003 deliberately uses the hero's Tailwind classes (`transition-opacity duration-700 ease-out`) instead of the token, to match the existing canvas fade exactly.
