# 003 — Fade each plate dot cloud in on its first frame, as the hero does

- **Status**: DONE
- **Commit**: 176c2de
- **Severity**: LOW
- **Category**: Missed opportunity (preventing a jarring change); Cohesion
- **Estimated scope**: 2 files, ~20 lines

## Problem

The hero starfield canvas starts at `opacity: 0` and fades in over 700ms once its first frame lands. The five team-plate dot clouds do not: their canvas is opaque from the start and the cloud pops in on the first GPU frame after the image sample and pipeline compile, typically a few hundred milliseconds after the plate is already on screen.

```tsx
{/* web/src/components/site/PlateFigure.tsx:36-45 — current */}
<div className={className} aria-hidden="true">
  <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
  {fallback && (
    …
  )}
</div>
```

```ts
// web/src/components/site/figure.ts:95 — current signature; nothing reports the first drawn frame
export async function startFigure(canvas: HTMLCanvasElement, src: string): Promise<() => void> {
```

```ts
// web/src/components/site/figure.ts:141-157 — current frame loop
const ensureLoop = () => {
  if (state.loop) return;
  state.loop = frameLoop(gpu, (f) => {
    let any = false;
    for (const p of plates) {
      if (!p.visible) continue;
      any = true;
      p.field.set({ params: { time: time.time } });
      f.pass(p.canvasSurface, p.field);
    }
    // Reduced motion draws each visible plate once and rests; no visible plates rests too.
    if (motion === 0 || !any) {
      state.loop?.stop();
      state.loop = null;
    }
  });
};
```

The hero already does this correctly and is the exemplar:

```tsx
{/* web/src/components/hero/StarfieldHero.tsx:100-104 — exemplar */}
<canvas
  ref={canvasRef}
  className="block h-full w-full transition-opacity duration-700 ease-out"
  style={{ opacity: status === "ready" ? 1 : 0 }}
/>
```

## Target

`startFigure` accepts an `onReady` callback and calls it once, on the animation frame after the plate's first pass is encoded. `PlateFigure` keeps `ready` state and applies the hero's exact classes and inline opacity to its canvas. Under reduced motion the loop still draws one frame, so `onReady` still fires and the fade still happens (opacity only, which is allowed).

```ts
// target — figure.ts
type Plate = { canvasSurface: Surface; field: Draw; stars: Geometry; visible: boolean; ready: boolean; onReady?: () => void };

export async function startFigure(canvas: HTMLCanvasElement, src: string, onReady?: () => void): Promise<() => void> {
  …
  const plate: Plate = { canvasSurface, field, stars, visible: true, ready: false, onReady };
  …
      for (const p of plates) {
        if (!p.visible) continue;
        any = true;
        p.field.set({ params: { time: time.time } });
        f.pass(p.canvasSurface, p.field);
        if (!p.ready) {
          p.ready = true;
          // The pass is presented after this callback returns; report on the next frame so the fade starts on pixels.
          const cb = p.onReady;
          if (cb) requestAnimationFrame(() => cb());
        }
      }
  …
}

export function startFigureSerialized(canvas: HTMLCanvasElement, src: string, isGone: () => boolean, onReady?: () => void): Promise<(() => void) | undefined> {
  const prev = chains.get(canvas) ?? Promise.resolve();
  const run = prev.then(() => (isGone() ? undefined : startFigure(canvas, src, onReady)));
  chains.set(canvas, run.catch(() => undefined));
  return run;
}
```

```tsx
{/* target — PlateFigure.tsx */}
const [ready, setReady] = useState(false);
…
  .then(({ startFigureSerialized }) => startFigureSerialized(canvas, src, () => gone, () => { if (!gone) setReady(true); }))
…
<canvas
  ref={ref}
  className="absolute inset-0 block h-full w-full transition-opacity duration-700 ease-out"
  style={{ opacity: ready ? 1 : 0 }}
/>
```

Exact values: the hero's classes `transition-opacity duration-700 ease-out` (Tailwind `ease-out` = `cubic-bezier(0, 0, 0.2, 1)`, 700ms). Do not substitute `--ease-out-expo`; matching the hero is the point.

## Repo conventions to follow

- Canvas readiness is reported through an `onReady` callback passed into the start function and stored in component state: see `web/src/components/hero/StarfieldHero.tsx:21` (`status` state) and `:47` (`onReady: () => setStatus("ready")`).
- The start functions guard against a torn-down component with a `gone`/`disposed` flag; keep that guard around `setReady`.
- `startFigureSerialized` (`figure.ts:176-181`) wraps `startFigure`; thread the new parameter through it rather than calling `startFigure` directly.

## Steps

1. In `web/src/components/site/figure.ts:85`, extend the `Plate` type with `ready: boolean; onReady?: () => void`.
2. In `figure.ts:95`, add the third parameter `onReady?: () => void` to `startFigure`.
3. In `figure.ts:137`, construct the plate as `{ canvasSurface, field, stars, visible: true, ready: false, onReady }`.
4. In the frame loop (`figure.ts:145-150`), after `f.pass(p.canvasSurface, p.field);`, insert the `if (!p.ready) { … }` block from **Target** verbatim.
5. In `figure.ts:176-178`, add the fourth parameter `onReady?: () => void` to `startFigureSerialized` and pass it as the third argument of `startFigure`.
6. In `web/src/components/site/PlateFigure.tsx:8`, add `const [ready, setReady] = useState(false);` beneath the `fallback` state.
7. In `PlateFigure.tsx:20`, change the call to `startFigureSerialized(canvas, src, () => gone, () => { if (!gone) setReady(true); })`.
8. In `PlateFigure.tsx:38`, replace the canvas element with the one from **Target** (add the three transition classes and the inline `opacity` style).

## Boundaries

- Do NOT change the shader, the star count, the sampling, the shared device, or the loop's stop conditions.
- Do NOT touch `StarfieldHero.tsx`, `Constellation.tsx`, or `TeamPlate.tsx`.
- Do NOT fade the fallback image (`PlateFigure.tsx:39-44`); it is shown only when WebGPU is absent and can stay static.
- Do NOT add dependencies.
- If the code at the cited lines does not match the excerpts above, STOP and report instead of improvising.

## Verification

- **Mechanical**: from `web/`, run `bun run lint` (no errors; note the repo's rule against calling setState synchronously in an effect, which this plan avoids because `setReady` runs from an async callback) and `bun run build` (success). `git diff --stat` shows only `figure.ts` and `PlateFigure.tsx`.
- **Feel check**: run `bun run dev` from `web/`, open `http://localhost:3000/#teams` in Chrome with WebGPU enabled, hard-reload with the Network panel throttled to "Fast 4G" so the load is visible, and confirm:
  - Each plate's dot cloud fades up over roughly 0.7s instead of appearing in one frame; the SVG constellation lines and labels over it are unaffected.
  - Scrolling a plate off-screen and back does not re-fade it (the plate stays at opacity 1).
  - Rendering panel, emulate `prefers-reduced-motion: reduce`, reload: the cloud still fades in once (opacity only), then holds still.
  - Chrome with WebGPU disabled (`chrome://flags` or `--disable-features=WebGPU`): the fallback mark image shows as before, no blank slot.
  - Performance panel during the fade: no long tasks introduced; the fade is a single compositor opacity transition per canvas.
- **Done when**: all five plates fade in on a throttled cold load and no plate ever renders a visible pop.
