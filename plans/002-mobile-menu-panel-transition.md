# 002 — Fade the mobile menu panel in and out on the same edge

- **Status**: DONE
- **Commit**: 176c2de
- **Severity**: MEDIUM
- **Category**: Missed opportunity (preventing a jarring change)
- **Estimated scope**: 2 files, ~30 lines

## Problem

Under `md` the nav is a "Menu" button that toggles a full-viewport panel with the `hidden` attribute. The panel teleports into view covering the whole page and teleports away again. It is the first interaction most phone visitors make.

```tsx
{/* web/src/components/site/NavMenu.tsx:30-34 — current */}
<div
  id={id}
  hidden={!open}
  className="fixed inset-x-0 top-20 bottom-0 z-40 bg-sky/97 px-5 pt-8"
>
```

The panel sits directly under the fixed 80px header (`top-20`), so its natural origin is the header edge above it.

## Target

The panel enters from the header edge with a short downward settle and a fade, and exits the same way in reverse (up and out). Entry uses `@starting-style` so no JavaScript timing is needed; exit uses `transition-behavior: allow-discrete` on `display`. While closed the panel is `display: none` and `inert`, so it is out of the tab order and accessibility tree exactly as `hidden` made it.

```css
/* target — web/src/app/globals.css, appended at the end of the file */

/* Small-screen nav panel: enters from the ecliptic and leaves the same way. */
.nav-panel {
  display: none;
  opacity: 0;
  translate: 0 -8px;
  transition:
    opacity 200ms var(--ease-out-expo),
    translate 200ms var(--ease-out-expo),
    display 200ms allow-discrete;
}
.nav-panel[data-open] {
  display: block;
  opacity: 1;
  translate: 0 0;
  @starting-style {
    opacity: 0;
    translate: 0 -8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .nav-panel,
  .nav-panel[data-open] {
    translate: 0 0;
  }
  .nav-panel {
    transition:
      opacity 200ms var(--ease-out-expo),
      display 200ms allow-discrete;
  }
}
```

```tsx
{/* target — web/src/components/site/NavMenu.tsx */}
<div
  id={id}
  data-open={open || undefined}
  inert={!open || undefined}
  className="nav-panel fixed inset-x-0 top-20 bottom-0 z-40 bg-sky/97 px-5 pt-8"
>
```

Exact values: 200ms for opacity, translate, and the discrete `display` flip; easing `var(--ease-out-expo)` which is `cubic-bezier(0.16, 1, 0.3, 1)`; entry offset `translate: 0 -8px`; exit returns to the same `-8px`. Reduced motion keeps the 200ms fade and drops the translate.

## Repo conventions to follow

- Easing token: `--ease-out-expo` at `web/src/app/globals.css:26`. Do not add a new token.
- Named motion classes live as plain CSS in `globals.css` with a one-line comment above and a `prefers-reduced-motion` override below, e.g. `.rule-draw` at `globals.css:118-128`.
- Components combine such classes with Tailwind utilities in `className` (e.g. `web/src/app/page.tsx:41`).
- React 19 is in use (`web/package.json`), so `inert` is a supported boolean prop; passing `undefined` omits the attribute.

## Steps

1. In `web/src/app/globals.css`, append the CSS from **Target** at the end of the file (after the last existing rule).
2. In `web/src/components/site/NavMenu.tsx:30-34`, replace the panel's opening tag with the JSX from **Target**: remove `hidden={!open}`, add `data-open={open || undefined}` and `inert={!open || undefined}`, and prepend `nav-panel ` to the className.
3. Leave the button (`NavMenu.tsx:21-29`), the Escape handler, the links, and `aria-expanded`/`aria-controls` untouched.

## Boundaries

- Do NOT change the panel's layout classes (`fixed inset-x-0 top-20 bottom-0 z-40 bg-sky/97 px-5 pt-8`) or the link markup inside it.
- Do NOT animate the "Menu"/"Close" label swap or the desktop nav.
- Do NOT add a JS-driven mount/unmount delay or a dependency; `@starting-style` and `allow-discrete` are the mechanism. Browsers without them snap as before, which is acceptable.
- Do NOT touch `web/src/components/site/Nav.tsx`.
- If the code at the cited lines does not match the excerpts above, STOP and report instead of improvising.

## Verification

- **Mechanical**: from `web/`, run `bun run lint` (no errors) and `bun run build` (success). `git diff --stat` shows only `web/src/app/globals.css` and `web/src/components/site/NavMenu.tsx`.
- **Feel check**: run `bun run dev` from `web/`, open `http://localhost:3000` in Chrome with the device toolbar at 390px wide, and confirm:
  - Tapping "Menu": the panel fades in and settles down about 8px from under the header; the header itself does not move.
  - Tapping "Close": the panel fades out and drifts up the same 8px, then disappears; it never fades out in place or slides down.
  - Tapping a link inside the panel closes it with the same exit and the page scrolls to the section.
  - Pressing Escape closes it with the same exit.
  - Tapping "Menu" then "Close" within 100ms reverses mid-fade; the panel never flashes to full opacity first.
  - With the panel closed, Tab never lands on a panel link (the panel is `inert` and `display: none`).
  - DevTools Animations panel at 10% speed: the fade starts quickly and lands softly; the vertical drift is barely perceptible at full speed.
  - Rendering panel, emulate `prefers-reduced-motion: reduce`: the panel fades in and out with no vertical drift.
- **Done when**: every feel check passes on a 390px viewport in Chrome and the panel is untabbable while closed.
