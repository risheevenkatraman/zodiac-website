import { clock, effect, frameLoop, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";
import { getSharedGpu } from "@/lib/gpu";

/**
 * The horizon band: night sky lightening into the cream plate (dawn) or the
 * plate darkening back into the sky (dusk). A low sun rises or sets with the
 * scroll, night stars fade above the glow. Palette only: sky, ink, lavender,
 * nebula pink, plate.
 */
const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  rise: f32,      // 0..1, how far the sun has risen (dawn) or set (dusk)
  dusk: f32,      // 0 dawn, 1 dusk
  aspect: f32,
  motion: f32,
  sunX: f32,      // where the sun sits across the band: east (right) at dawn, west (left) at dusk
  _p1: f32, _p2: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

const SKY = vec3f(0.043, 0.027, 0.086);
const INK_DEEP = vec3f(0.239, 0.133, 0.369);
const INK = vec3f(0.435, 0.247, 0.647);
const LAVENDER = vec3f(0.788, 0.702, 0.910);
const NEBULA = vec3f(0.769, 0.420, 0.839);
const PLATE = vec3f(0.953, 0.918, 0.859);
const WHITE = vec3f(1.0);

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // y runs 0 at the night edge to 1 at the plate edge, whichever way the band faces.
  let y = mix(uv.y, 1.0 - uv.y, params.dusk);
  let horizon = 0.66;
  let rise = params.rise;

  // Sky: night at the top, lifting through ink toward lavender near the horizon.
  var sky = mix(SKY, INK_DEEP, smoothstep(0.05, horizon - 0.1, y));
  sky = mix(sky, mix(INK, LAVENDER, 0.55), smoothstep(horizon - 0.22, horizon, y) * (0.4 + 0.6 * rise));

  // The sun: a small, quiet disc on the horizon, higher as it rises.
  let sunY = horizon + 0.10 - rise * 0.16;
  let d = vec2f((uv.x - params.sunX) * params.aspect, y - sunY);
  let r = length(d);
  let disc = smoothstep(0.05, 0.038, r);
  let glow = exp(-r * r * 14.0) * (0.25 + 0.45 * rise);
  let ang = atan2(d.y, d.x);
  let rays = (0.5 + 0.5 * sin(ang * 22.0 + params.time * 0.15 * params.motion)) * exp(-r * 3.0) * 0.045 * rise;
  let sunColor = mix(NEBULA, PLATE, 0.5);
  var col = sky + mix(NEBULA, LAVENDER, 0.5) * glow * 0.45 + sunColor * rays;
  col = mix(col, mix(PLATE, WHITE, 0.35), disc * 0.9);

  // Night stars, only where the sky is still dark.
  let cell = floor(uv * vec2f(90.0 * params.aspect, 90.0));
  let h = hash21(cell);
  let starPt = smoothstep(0.35, 0.0, length(fract(uv * vec2f(90.0 * params.aspect, 90.0)) - 0.5));
  let twinkle = 0.6 + 0.4 * sin(params.time * (0.8 + h * 2.0) * params.motion + h * 6.28);
  let stars = step(0.975, h) * starPt * twinkle * (1.0 - smoothstep(0.15, horizon - 0.15, y)) * 0.8;
  col += LAVENDER * stars;

  // Ground: the plate, with a soft edge at the horizon.
  col = mix(col, PLATE, smoothstep(horizon - 0.01, horizon + 0.07, y));

  // Dither against banding.
  col += (hash21(uv * 1911.0 + params.time) - 0.5) / 255.0;
  // The night end dissolves to transparent so the page's own sky carries on beneath.
  let alpha = smoothstep(0.0, 0.42, y);
  return vec4f(col * alpha, alpha);
}
`;

export type HorizonHandle = { setRise(r: number): void; setVisible(v: boolean): void; dispose(): void };

export async function startHorizon(canvas: HTMLCanvasElement, dusk: boolean): Promise<HorizonHandle> {
  const { gpu, motion } = await getSharedGpu();
  const canvasSurface = surface(gpu, canvas, { dpr: [1, 1.5], clearColor: [0, 0, 0, 0] });
  const aspectOf = () => {
    const [w, h] = canvasSurface.size;
    return Math.max(0.2, w / Math.max(1, h));
  };
  const fx = effect(gpu, SHADER, {
    label: dusk ? "dusk" : "dawn",
    set: { params: { time: 0, rise: motion ? 0 : 0.6, dusk: dusk ? 1 : 0, aspect: aspectOf(), motion, sunX: dusk ? 0.2 : 0.8, _p1: 0, _p2: 0 } },
  });
  canvasSurface.onResize(() => fx.set({ params: { aspect: aspectOf() } }));

  const time = clock(gpu);
  const state = { rise: motion ? 0 : 0.6, visible: true };
  let loop: FrameLoopHandle | undefined;
  const render = (frame: Parameters<Parameters<typeof frameLoop>[1]>[0]) => {
    fx.set({ params: { time: time.time, rise: state.rise } });
    frame.pass(canvasSurface, fx);
  };
  const start = () => {
    if (loop) return;
    loop = frameLoop(gpu, (f) => {
      render(f);
      if (!motion) {
        loop?.stop();
        loop = undefined;
      }
    });
  };
  start();

  return {
    setRise(r) {
      state.rise = Math.max(0, Math.min(1, r));
      if (!motion) start();
    },
    setVisible(v) {
      state.visible = v;
      if (v) start();
      else {
        loop?.stop();
        loop = undefined;
      }
    },
    dispose() {
      loop?.stop();
      canvasSurface.dispose();
    },
  };
}
