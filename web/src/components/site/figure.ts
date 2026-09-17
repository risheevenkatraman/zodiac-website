import { clock, draw, frameLoop, geometry, surface } from "vgpu";
import type { Draw, FrameLoopHandle, Geometry, Surface } from "vgpu";
import { samplePoints } from "@/components/hero/sample";
import { getSharedGpu } from "@/lib/gpu";

/**
 * Plate figures as dot clouds: each mark is sampled into a few thousand stars
 * drawn with the same instanced-quad grammar as the hero, breathing slowly.
 * One WebGPU device is shared by every plate on the page; only visible plates
 * are drawn, and there is no per-plate preprocessing beyond sampling the mark.
 */

/** The SVG unit box the plate's constellation overlay uses; the canvas maps to the same box. */
export const PLATE_BOX = { x: -70, y: -24, w: 380, h: 288 };
const STARS = 1500;

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  motion: f32,
  aspect: f32,
  _pad: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

struct Out {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) color: vec3f,
  @location(2) glow: f32,
  @location(3) mag: f32,
}

fn hash11(p: f32) -> f32 {
  var q = fract(p * 0.1031);
  q *= q + 33.33;
  q *= q + q;
  return fract(q);
}

@vertex fn vs_main(
  @location(0) corner: vec2f,
  @location(1) a: vec4f,   // clip xy, magnitude, seed
  @location(2) c: vec4f,   // rgb, phase
) -> Out {
  let seed = a.w;
  let mag = a.z;
  // A slow breath: every star drifts on its own tiny orbit.
  let t = params.time * params.motion;
  let wobble = vec2f(
    sin(t * (0.5 + hash11(seed * 3.1) * 0.5) + c.w),
    cos(t * (0.4 + hash11(seed * 7.7) * 0.5) + c.w * 1.3),
  ) * 0.006;
  let center = a.xy + wobble;
  let size = (0.007 + mag * mag * 0.026);
  let offset = vec2f(corner.x * size / params.aspect, corner.y * size);
  let twinkle = 0.75 + 0.25 * sin(t * (1.0 + hash11(seed * 5.5) * 2.0) + c.w);

  var out: Out;
  out.position = vec4f(center + offset, 0.0, 1.0);
  out.uv = corner;
  // Keep the mark's own colour: only the brightest stars whiten toward starlight.
  out.color = mix(c.rgb, vec3f(0.93, 0.91, 0.96), 0.04 + mag * mag * 0.4);
  out.glow = twinkle * (0.5 + mag * 0.5) * 0.95;
  out.mag = mag;
  return out;
}

@fragment fn fs_main(
  @location(0) uv: vec2f,
  @location(1) color: vec3f,
  @location(2) glow: f32,
  @location(3) mag: f32,
) -> @location(0) vec4f {
  let d = length(uv);
  let core = smoothstep(0.5, 0.0, d);
  let halo = smoothstep(1.0, 0.2, d) * 0.12;
  let flareGate = smoothstep(0.93, 0.99, mag);
  let flare = (pow(max(0.0, 1.0 - abs(uv.x)), 9.0) + pow(max(0.0, 1.0 - abs(uv.y)), 9.0)) * 0.5 * flareGate;
  let l = (core * 1.25 + halo + flare) * glow;
  return vec4f(color * l, l);
}
`;

type Plate = { canvasSurface: Surface; field: Draw; stars: Geometry; visible: boolean; ready: boolean; onReady?: () => void };

const registry: { plates: Set<Plate>; loop: FrameLoopHandle | null } = { plates: new Set(), loop: null };
async function getShared() {
  const { gpu, motion } = await getSharedGpu();
  return { gpu, motion, plates: registry.plates, get loop() { return registry.loop; }, set loop(v: FrameLoopHandle | null) { registry.loop = v; } };
}

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

export async function startFigure(canvas: HTMLCanvasElement, src: string, onReady?: () => void): Promise<() => void> {
  const [state, sample] = await Promise.all([
    getShared(),
    samplePoints(src, { count: STARS, resolution: 320, fit: 0.78, seed: 5 }),
  ]);
  const { gpu, plates, motion } = state;

  // Interleave: a(clip xy, mag, seed) c(rgb, phase) = 8 floats per star. The sampled
  // normalized coordinates are mapped through plate units into the canvas's clip space so
  // the SVG constellation overlay lands on the same stars.
  const inst = new Float32Array(STARS * 8);
  for (let i = 0; i < STARS; i++) {
    const ux = 120 + sample.positions[i * 3] * 110;
    const uy = 120 - sample.positions[i * 3 + 1] * 110;
    const o = i * 8;
    inst[o] = ((ux - PLATE_BOX.x) / PLATE_BOX.w) * 2 - 1;
    inst[o + 1] = 1 - ((uy - PLATE_BOX.y) / PLATE_BOX.h) * 2;
    inst[o + 2] = Math.pow(Math.random(), 2.4);
    inst[o + 3] = Math.random();
    const lift = 0.02;
    inst[o + 4] = sample.colors[i * 3] * (1 - lift) + lift;
    inst[o + 5] = sample.colors[i * 3 + 1] * (1 - lift) + lift;
    inst[o + 6] = sample.colors[i * 3 + 2] * (1 - lift) + lift;
    inst[o + 7] = Math.random() * 6.2831853;
  }
  const stars = geometry(gpu, {
    topology: "triangle-strip",
    buffers: [
      { data: QUAD, attributes: { corner: "float32x2" } },
      { stepMode: "instance", data: inst, attributes: { a: { format: "float32x4", location: 1 }, c: { format: "float32x4", location: 2 } } },
    ],
  });
  const canvasSurface = surface(gpu, canvas, { dpr: [1, 2], clearColor: [0, 0, 0, 0] });
  const aspect = PLATE_BOX.w / PLATE_BOX.h;
  const field = draw(gpu, {
    shader: SHADER,
    geometry: stars,
    instances: STARS,
    blend: "additive",
    label: "plate-figure",
    set: { params: { time: 0, motion, aspect, _pad: 0 } },
  });
  const plate: Plate = { canvasSurface, field, stars, visible: true, ready: false, onReady };
  plates.add(plate);

  const time = clock(gpu);
  const ensureLoop = () => {
    if (state.loop) return;
    state.loop = frameLoop(gpu, (f) => {
      let any = false;
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
      // Reduced motion draws each visible plate once and rests; no visible plates rests too.
      if (motion === 0 || !any) {
        state.loop?.stop();
        state.loop = null;
      }
    });
  };
  ensureLoop();

  const io = new IntersectionObserver(([entry]) => {
    plate.visible = entry.isIntersecting;
    if (plate.visible) ensureLoop();
  });
  io.observe(canvas);

  return () => {
    io.disconnect();
    plates.delete(plate);
    stars.destroy();
    canvasSurface.dispose();
  };
}

/** Starts are serialized per canvas so a strict-mode remount never opens a second surface on the same canvas. */
const chains = new WeakMap<HTMLCanvasElement, Promise<unknown>>();
export function startFigureSerialized(canvas: HTMLCanvasElement, src: string, isGone: () => boolean, onReady?: () => void): Promise<(() => void) | undefined> {
  const prev = chains.get(canvas) ?? Promise.resolve();
  const run = prev.then(() => (isGone() ? undefined : startFigure(canvas, src, onReady)));
  chains.set(canvas, run.catch(() => undefined));
  return run;
}
