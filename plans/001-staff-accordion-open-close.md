# 001 — Ease the staff bio accordion open and closed

- **Status**: DONE
- **Commit**: 176c2de
- **Severity**: MEDIUM
- **Category**: Missed opportunity (state indication; preventing a jarring change)
- **Estimated scope**: 2 files, ~25 lines

## Problem

The staff bios are native `<details name="staff">` disclosures. Opening one snaps the bio paragraph into place, and because `name="staff"` makes the group exclusive, the previously open bio vanishes in the same frame. The section below shifts by the height difference with no bridge. It is the one click-to-read interaction on the About plate, so every visitor who reads a bio hits it.

```tsx
{/* web/src/components/site/StaffList.tsx:17-47 — current */}
<details name="staff" className="group">
  <summary className="flex cursor-pointer list-none items-center gap-4 py-4 [&::-webkit-details-marker]:hidden">
    …
  </summary>
  {bio && (
    <p className="font-text max-w-[60ch] pb-6 pl-14 text-[1.05rem] leading-relaxed text-plate-ink/85">{bio}</p>
  )}
</details>
```

There is no CSS for `details` or `::details-content` anywhere in `web/src/app/globals.css`.

## Target

The disclosure content eases its height open and closed, and the bio text fades in a beat behind the height. The closing sibling in the exclusive group eases shut the same way. Where `::details-content` is unsupported the accordion snaps exactly as it does today.

```css
/* target — web/src/app/globals.css, appended after the .constellation-pulse block (after line 141) */

/* Staff bios: the disclosure eases open and shut instead of snapping. */
.bio-details {
  interpolate-size: allow-keywords;
}
.bio-details::details-content {
  height: 0;
  overflow: hidden;
  transition:
    height 250ms var(--ease-out-expo),
    content-visibility 250ms allow-discrete;
}
.bio-details[open]::details-content {
  height: auto;
}
.bio-details .bio-text {
  opacity: 0;
  translate: 0 -4px;
  transition:
    opacity 200ms var(--ease-out-expo) 60ms,
    translate 200ms var(--ease-out-expo) 60ms;
}
.bio-details[open] .bio-text {
  opacity: 1;
  translate: 0 0;
}
@media (prefers-reduced-motion: reduce) {
  .bio-details::details-content {
    transition: content-visibility 0s allow-discrete;
  }
  .bio-details .bio-text {
    translate: 0 0;
    transition: opacity 150ms var(--ease-out-expo);
  }
}
```

```tsx
{/* target — web/src/components/site/StaffList.tsx */}
<details name="staff" className="group bio-details">
  …
  {bio && (
    <p className="bio-text font-text max-w-[60ch] pb-6 pl-14 text-[1.05rem] leading-relaxed text-plate-ink/85">{bio}</p>
  )}
</details>
```

Exact values: easing `var(--ease-out-expo)` which is `cubic-bezier(0.16, 1, 0.3, 1)`; height 250ms; text opacity and translate 200ms with a 60ms delay; reduced motion drops the height and translate transitions and keeps a 150ms opacity fade.

## Repo conventions to follow

- The only easing token is `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` in `web/src/app/globals.css:26`. Use it by name. Do not add a new token.
- Named motion classes are plain CSS in `globals.css` under a one-line comment, e.g. the `.rule-draw` block at `globals.css:118-128`, each with its own `@media (prefers-reduced-motion: reduce)` override directly below. Imitate that shape.
- Components attach these classes alongside Tailwind utilities (e.g. `className="hairline rule-draw border-t"` in `web/src/app/page.tsx:41`).
- The open-state glyph rotation already on the summary (`StaffList.tsx:42`, `transition-transform duration-300 ease-out group-open:rotate-45`) stays as it is.

## Steps

1. In `web/src/app/globals.css`, after the `.constellation-pulse` reduced-motion block (currently ending at line 141), append the CSS from **Target** verbatim.
2. In `web/src/components/site/StaffList.tsx:17`, change `className="group"` on the `<details>` to `className="group bio-details"`.
3. In `web/src/components/site/StaffList.tsx:47`, prepend `bio-text ` to the `<p>` className so it reads `className="bio-text font-text max-w-[60ch] pb-6 pl-14 text-[1.05rem] leading-relaxed text-plate-ink/85"`.

## Boundaries

- Do NOT change the `<details>`/`<summary>` markup, the `name="staff"` grouping, the "Read bio"/"Close" copy, or the glyph rotation.
- Do NOT replace the native disclosure with a JavaScript accordion.
- Do NOT add dependencies or a JS height-measuring fallback. Unsupported browsers snap, as today.
- Do NOT touch any other component.
- If the code at the cited lines does not match the excerpts above, STOP and report instead of improvising.

## Verification

- **Mechanical**: from `web/`, run `bun run lint` (expect no errors) and `bun run build` (expect a successful build). Run `git diff --stat` and confirm only `web/src/app/globals.css` and `web/src/components/site/StaffList.tsx` changed.
- **Feel check**: run `bun run dev` from `web/`, open `http://localhost:3000/#about` in Chrome 131+ or Safari 18.4+, scroll to the staff list, and confirm:
  - Clicking "Read bio" grows the row smoothly; the text fades in slightly after the row starts growing, not before.
  - Clicking a second person's "Read bio" while one is open shrinks the first and grows the second at the same time; the page below never jumps.
  - Clicking "Close" shrinks the row with the same curve; the text fades out with it.
  - In DevTools, Animations panel at 10% speed: height motion decelerates hard at the end (fast start, soft landing); nothing overshoots.
  - Rapidly clicking the same summary three times never restarts from zero; the height reverses mid-way.
  - Rendering panel, emulate `prefers-reduced-motion: reduce`: the row snaps open, the text still fades in over ~150ms, nothing slides.
  - Firefox (no `::details-content` at the commit stamp): the accordion behaves exactly as before the change, no broken layout, bio visible when open.
- **Done when**: all feel checks pass in Chrome and the Firefox fallback is unchanged from the pre-change behaviour.
