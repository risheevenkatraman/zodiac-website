# 004 — Add press feedback to the pill buttons

- **Status**: DONE
- **Commit**: 176c2de
- **Severity**: LOW
- **Category**: Missed opportunity (feedback)
- **Estimated scope**: 5 files, ~15 lines

## Problem

The rounded pill controls (Discord CTAs, "See the teams", store link, X link, the mobile "Menu" button) change colour on hover but give nothing on press. A tap on a phone, where hover does not exist, produces no acknowledgement until the new tab opens.

Current pills, all `rounded-full` with `px-… py-…`:

```tsx
{/* web/src/components/hero/HeroScene.tsx:87 — current */}
className="caps rounded-full bg-ink px-6 py-3.5 text-white no-underline shadow-[0_12px_40px_-12px_rgba(111,63,165,0.9)] transition-colors hover:bg-[#7d4dba]"
{/* web/src/components/hero/HeroScene.tsx:91 — current */}
className="caps hairline rounded-full border px-6 py-3.5 text-starlight no-underline transition-colors hover:border-lavender"
{/* web/src/app/page.tsx:148 — current */}
className="caps mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-white no-underline hover:bg-ink-deep"
{/* web/src/app/page.tsx:181 — current */}
className="caps rounded-full bg-ink px-6 py-3.5 text-white no-underline hover:bg-[#7d4dba]"
{/* web/src/app/page.tsx:184 — current */}
className="caps hairline rounded-full border px-6 py-3.5 text-starlight no-underline hover:border-lavender"
{/* web/src/components/site/Nav.tsx:55 — current */}
className="caps hairline hidden rounded-full border px-4 py-2 text-starlight no-underline transition-colors hover:border-lavender hover:bg-ink/25 sm:inline-block"
{/* web/src/components/site/NavMenu.tsx:26 — current */}
className="caps hairline rounded-full border px-4 py-2 text-starlight transition-colors hover:border-lavender"
{/* web/src/components/site/NavMenu.tsx:49 — current */}
className="caps mt-8 inline-flex w-fit rounded-full bg-ink px-6 py-3.5 text-white no-underline"
```

## Target

One shared class, `pill-press`, gives every pill a 3% press scale with a 160ms ease-out return, and folds the existing colour transition into the same declaration so the two never fight. Reduced motion keeps a smaller 1.5% press so the feedback survives.

```css
/* target — web/src/app/globals.css, appended at the end of the file */

/* Pills: a light press under the finger, back on release. */
.pill-press {
  transition:
    transform 160ms var(--ease-out-expo),
    background-color 160ms var(--ease-out-expo),
    border-color 160ms var(--ease-out-expo);
}
.pill-press:active {
  transform: scale(0.97);
}
@media (prefers-reduced-motion: reduce) {
  .pill-press:active {
    transform: scale(0.985);
  }
}
```

Each pill above gains `pill-press` and loses `transition-colors` (where present), so the resulting classNames are:

```tsx
{/* HeroScene.tsx:87 */}
"pill-press caps rounded-full bg-ink px-6 py-3.5 text-white no-underline shadow-[0_12px_40px_-12px_rgba(111,63,165,0.9)] hover:bg-[#7d4dba]"
{/* HeroScene.tsx:91 */}
"pill-press caps hairline rounded-full border px-6 py-3.5 text-starlight no-underline hover:border-lavender"
{/* page.tsx:148 */}
"pill-press caps mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-white no-underline hover:bg-ink-deep"
{/* page.tsx:181 */}
"pill-press caps rounded-full bg-ink px-6 py-3.5 text-white no-underline hover:bg-[#7d4dba]"
{/* page.tsx:184 */}
"pill-press caps hairline rounded-full border px-6 py-3.5 text-starlight no-underline hover:border-lavender"
{/* Nav.tsx:55 */}
"pill-press caps hairline hidden rounded-full border px-4 py-2 text-starlight no-underline hover:border-lavender hover:bg-ink/25 sm:inline-block"
{/* NavMenu.tsx:26 */}
"pill-press caps hairline rounded-full border px-4 py-2 text-starlight hover:border-lavender"
{/* NavMenu.tsx:49 */}
"pill-press caps mt-8 inline-flex w-fit rounded-full bg-ink px-6 py-3.5 text-white no-underline"
```

Exact values: `scale(0.97)` on `:active`; 160ms; easing `var(--ease-out-expo)` = `cubic-bezier(0.16, 1, 0.3, 1)`; reduced motion `scale(0.985)`.

## Repo conventions to follow

- Easing token `--ease-out-expo` at `web/src/app/globals.css:26`; do not add another.
- Shared motion classes are plain CSS in `globals.css` with a one-line comment and a reduced-motion override beneath (see `.rule-draw`, `globals.css:118-128`). Do not use `@utility` for this one: a Tailwind utility would be overridden by any leftover `transition-colors`, which is why that class is removed from each pill.
- Do not use Tailwind `active:` variants inline; the point is a single class so all eight pills behave identically.

## Steps

1. In `web/src/app/globals.css`, append the `.pill-press` CSS from **Target** at the end of the file.
2. In `web/src/components/hero/HeroScene.tsx:87` and `:91`, set the classNames to the two strings listed under **Target** for that file.
3. In `web/src/app/page.tsx:148`, `:181`, and `:184`, set the classNames to the three strings listed for that file.
4. In `web/src/components/site/Nav.tsx:55`, set the className to the string listed for that file.
5. In `web/src/components/site/NavMenu.tsx:26` and `:49`, set the classNames to the two strings listed for that file.
6. Grep `web/src` for `transition-colors` afterwards. The remaining hits should be exactly `TeamPlate.tsx:94` (roster row) and `StaffList.tsx:39` (bio label); leave those.

## Boundaries

- Do NOT add press feedback to text links, the nav links, roster rows, the footer, or the SVG house ring.
- Do NOT change padding, colours, hover colours, or copy on any pill.
- Do NOT add dependencies.
- If a className at a cited line does not match the "current" excerpt, STOP and report instead of improvising.

## Verification

- **Mechanical**: from `web/`, run `bun run lint` (no errors) and `bun run build` (success). `git diff --stat` shows exactly `globals.css`, `HeroScene.tsx`, `page.tsx`, `Nav.tsx`, `NavMenu.tsx`.
- **Feel check**: run `bun run dev` from `web/`, open `http://localhost:3000` in Chrome, and confirm:
  - Mouse down on "Join the Discord" in the hero shrinks it slightly and holding keeps it shrunk; release springs it back in well under a quarter second, no bounce.
  - The hover colour change and the press scale happen together with no flicker.
  - On the device toolbar at 390px, tapping "Menu" shows the press, and the panel still toggles.
  - DevTools Animations panel at 10% speed: the return to `scale(1)` is fast-then-soft (the expo curve), never linear.
  - Rendering panel, emulate `prefers-reduced-motion: reduce`: a press is still visible but about half as deep.
  - Keyboard: focusing a pill and pressing Enter opens the link without any scale (there is no `:active` from Enter in most browsers; Space on a `<button>` may show it, which is fine).
- **Done when**: all eight pills show the press at the same depth and timing and the lint/build pass.
