import { clock, draw, frameLoop, geometry, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";
import { samplePoints } from "./sample";

/**
 * The starfield: one instanced quad per star, two morph targets (the Z
 * monogram, the ring of twelve) and a scattered start state derived in the
 * shader. Positions and colours are sampled from the real marks at runtime.
 */
const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  reveal: f32,
  morph: f32,
  aspect: f32,
  pointer: vec2f,
  offset: vec2f,
  scale: f32,
  fade: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
// The pointer's wake: recent positions in clip space (xy), their remaining strength (z).
struct Stir { samples: array<vec4f, 10> }
@group(0) @binding(1) var<uniform> stir: Stir;

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

fn easeOut(x: f32) -> f32 {
  let t = clamp(x, 0.0, 1.0);
  return 1.0 - pow(1.0 - t, 3.0);
}

fn rotY(p: vec3f, a: f32) -> vec3f {
  let c = cos(a); let s = sin(a);
  return vec3f(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}
fn rotX(p: vec3f, a: f32) -> vec3f {
  let c = cos(a); let s = sin(a);
  return vec3f(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

@vertex fn vs_main(
  @location(0) corner: vec2f,
  @location(1) a: vec4f,   // monogram xyz + magnitude
  @location(2) b: vec4f,   // ring xyz + seed
  @location(3) c: vec4f,   // monogram rgb + phase
  @location(4) d: vec4f,   // ring rgb + house weight (1 lit house or centre, 0.3 quiet house)
) -> Out {
  let seed = b.w;
  let mag = a.w;

  // Scattered start state: a loose shell around the viewer.
  let u = hash11(seed * 7.13);
  let v = hash11(seed * 3.71);
  let theta = u * 6.2831853;
  let phi = acos(2.0 * v - 1.0);
  let r = 1.4 + hash11(seed * 9.2) * 1.2;
  let scatter = vec3f(r * sin(phi) * cos(theta), r * sin(phi) * sin(theta), r * cos(phi) - 0.8);

  // Staggered reveal: each star gathers on its own delay.
  let tA = easeOut((params.reveal * 1.35 - seed * 0.35));
  let tB = easeOut((params.morph * 1.25 - seed * 0.25));
  let depthA = vec3f(a.xy, a.z * 0.18);
  // The ring is a line drawing: it keeps almost no depth so the figures stay crisp, and it
  // is scaled to sit between the nav and the horizon legend.
  let depthB = vec3f(b.xy * 0.88, b.z * 0.03) + vec3f(0.0, -0.04, 0.0);
  var p = mix(scatter, depthA, tA);
  p = mix(p, depthB, tB);

  // Slow drift plus pointer parallax on the whole sky.
  let drift = sin(params.time * 0.12) * 0.035;
  p = rotY(p, params.pointer.x * 0.16 + drift);
  p = rotX(p, -params.pointer.y * 0.1);

  // Perspective and aspect.
  let depth = 1.0 / (1.55 + p.z);
  // The monogram sits off-centre so the type never covers it; the ring returns to centre.
  let shift = params.offset * (1.0 - tB);
  var screen = vec2f(p.x * params.scale / params.aspect, p.y * params.scale) * depth + shift;

  // Disruption: every recent pointer sample pushes nearby stars outward and a little
  // sideways, weighted by its remaining strength, so a pass through the field throws
  // stars along the wake and they drift back as the samples fade.
  var push = vec2f(0.0);
  for (var i = 0u; i < 10u; i++) {
    let sm = stir.samples[i];
    if (sm.z < 0.01) { continue; }
    let dlt = vec2f((screen.x - sm.x) * params.aspect, screen.y - sm.y);
    let dist2 = dot(dlt, dlt);
    let fall = exp(-dist2 * 30.0);
    let dir = normalize(dlt + vec2f(0.0001, 0.0));
    let swirl = vec2f(-dir.y, dir.x);
    let perStar = 0.7 + hash11(seed * 2.9) * 0.6;
    push += (dir * 0.042 + swirl * 0.018) * fall * sm.z * perStar * depth;
  }
  screen += vec2f(push.x / params.aspect, push.y);

  // Star size in clip units, larger for brighter stars, tightened once settled.
  let settle = mix(0.6, 1.0, tA);
  let sizeScale = params.scale / 1.25;
  let size = (0.0022 + mag * mag * 0.011) * depth * settle * sizeScale * mix(1.0, 0.75, tB);
  let offset = vec2f(corner.x * size / params.aspect, corner.y * size);

  let twinkle = 0.78 + 0.22 * sin(params.time * (1.2 + hash11(seed * 5.5) * 2.4) + c.w);

  var out: Out;
  out.position = vec4f(screen + offset, 0.0, 1.0);
  out.uv = corner;
  let colorA = mix(c.rgb, vec3f(0.93, 0.91, 0.96), 0.12 + mag * 0.3);
  let colorB = mix(d.rgb, vec3f(0.93, 0.91, 0.96), mag * 0.35);
  out.color = mix(colorA, colorB, tB);
  let glowA = 0.45 + mag * 0.55;
  let glowB = (0.7 + mag * 0.3) * d.w;
  out.glow = twinkle * params.fade * mix(0.3, 1.0, tA) * mix(glowA, glowB, tB);
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
  let halo = smoothstep(1.0, 0.2, d) * 0.1;
  // Four-point flare for the brightest stars only: the atlas magnitude-one mark.
  let flareGate = smoothstep(0.86, 0.96, mag);
  let flare = (pow(max(0.0, 1.0 - abs(uv.x)), 9.0) + pow(max(0.0, 1.0 - abs(uv.y)), 9.0)) * 0.5 * flareGate;
  let l = (core * 1.3 + halo + flare) * glow;
  return vec4f(color * l, l);
}
`;

export type StarfieldHandle = {
  setMorph(m: number): void;
  setPointer(x: number, y: number): void;
  /** Record a pointer position over the canvas, in clip space (x right, y up, both in [-1, 1]). */
  stir(x: number, y: number): void;
  setFade(f: number): void;
  setPaused(paused: boolean): void;
  dispose(): void;
};

export type StarfieldOptions = {
  count: number;
  reducedMotion: boolean;
  onReady?: () => void;
  onError?: (err: unknown) => void;
};

export async function startStarfield(canvas: HTMLCanvasElement, opts: StarfieldOptions): Promise<StarfieldHandle> {
  const count = opts.count;
  const [mono, ring] = await Promise.all([
    samplePoints("/marks/monogram.png", { count, resolution: 320, fit: 0.86, seed: 11 }),
    samplePoints("/marks/ring.png", { count, resolution: 1000, fit: 0.95, holeRadius: 0.36, seed: 23 }),
  ]);

  // The twelve houses sit 30° apart counter-clockwise from the Tiger at the top; four are active
  // rosters and take their real team-logo colours (recorded in the direction contract).
  const houseColor: Record<number, [number, number, number]> = {
    0: [1.0, 0.48, 0.0], // Tigers
    1: [0.04, 0.42, 1.0], // Ox
    4: [0.79, 0.8, 0.84], // Goats
    8: [1.0, 0.24, 0.54], // Piggies
  };
  const quiet: [number, number, number] = [0.79, 0.7, 0.91];
  const centreShare = Math.floor(count * 0.14);

  // Interleave: a(xyz,mag) b(xyz,seed) c(rgb,phase) d(rgb,weight) = 16 floats per star.
  const inst = new Float32Array(count * 16);
  for (let i = 0; i < count; i++) {
    const o = i * 16;
    const u = Math.random();
    const mag = Math.pow(u, 2.6); // few bright stars, many faint
    inst[o] = mono.positions[i * 3];
    inst[o + 1] = mono.positions[i * 3 + 1];
    inst[o + 2] = mono.positions[i * 3 + 2];
    inst[o + 3] = mag;
    let rx = ring.positions[i * 3];
    let ry = ring.positions[i * 3 + 1];
    let house: [number, number, number] = quiet;
    let weight = 0.55;
    if (i < centreShare) {
      // A small Zodiac monogram holds the centre of its houses.
      rx = mono.positions[i * 3] * 0.3;
      ry = mono.positions[i * 3 + 1] * 0.3;
      house = [mono.colors[i * 3], mono.colors[i * 3 + 1], mono.colors[i * 3 + 2]];
      weight = 1.0;
    } else {
      const angle = Math.atan2(ry, rx);
      const k = (Math.round((angle - Math.PI / 2) / (Math.PI / 6)) % 12 + 12) % 12;
      const lit = houseColor[k];
      if (lit) {
        house = lit;
        weight = 1.0;
      }
    }
    inst[o + 4] = rx;
    inst[o + 5] = ry;
    inst[o + 6] = ring.positions[i * 3 + 2];
    inst[o + 7] = Math.random();
    // Colour: the mark's own pixel, lifted toward starlight for faint stars.
    const lift = 0.06 + mag * 0.2;
    inst[o + 8] = mono.colors[i * 3] * (1 - lift) + lift;
    inst[o + 9] = mono.colors[i * 3 + 1] * (1 - lift) + lift;
    inst[o + 10] = mono.colors[i * 3 + 2] * (1 - lift) + lift;
    inst[o + 11] = Math.random() * 6.2831853;
    inst[o + 12] = house[0];
    inst[o + 13] = house[1];
    inst[o + 14] = house[2];
    inst[o + 15] = weight;
  }

  const gpu = await init();
  // Stars are soft points; 1.5x is indistinguishable from 2x and cuts fill cost by 44%.
  const canvasSurface = surface(gpu, canvas, { dpr: [1, 1.5], clearColor: [0, 0, 0, 0] });
  const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const stars = geometry(gpu, {
    topology: "triangle-strip",
    buffers: [
      { data: quad, attributes: { corner: "float32x2" } },
      {
        stepMode: "instance",
        data: inst,
        attributes: {
          a: { format: "float32x4", location: 1 },
          b: { format: "float32x4", location: 2 },
          c: { format: "float32x4", location: 3 },
          d: { format: "float32x4", location: 4 },
        },
      },
    ],
  });

  const state = { morph: 0, px: 0, py: 0, fade: 1.05, paused: false, reveal: opts.reducedMotion ? 1 : 0 };
  const STIR = 10;
  const wake: { x: number; y: number; t: number }[] = [];
  const stirData: [number, number, number, number][] = Array.from({ length: STIR }, () => [0, 0, 0, 0]);
  const aspectOf = () => {
    const [w, h] = canvasSurface.size;
    return Math.max(0.2, w / Math.max(1, h));
  };
  const scaleFor = (aspect: number) => (aspect > 1 ? Math.min(1.35, aspect * 0.95) : Math.min(1.25, aspect * 1.15));
  const offsetFor = (aspect: number): [number, number] => (aspect > 1 ? [0.34, 0.04] : [0, 0.24]);

  const field = draw(gpu, {
    shader: SHADER,
    geometry: stars,
    instances: count,
    blend: "additive",
    label: "starfield",
    set: {
      params: {
        time: 0,
        reveal: state.reveal,
        morph: 0,
        aspect: aspectOf(),
        pointer: [0, 0],
        offset: offsetFor(aspectOf()),
        scale: scaleFor(aspectOf()),
        fade: state.fade,
      },
      stir: { samples: stirData },
    },
  });
  canvasSurface.onResize(() => {
    const aspect = aspectOf();
    field.set({ params: { aspect, scale: scaleFor(aspect), offset: offsetFor(aspect) } });
  });
  // Pipelines compile lazily on the first frame; surfaces cannot be pre-compiled against.

  const time = clock(gpu);
  let loop: FrameLoopHandle | undefined;
  const start = performance.now();

  const render = (frame: Parameters<Parameters<typeof frameLoop>[1]>[0]) => {
    if (!opts.reducedMotion) {
      state.reveal = Math.min(1, (performance.now() - start) / 2600);
    }
    // Age the wake: strength decays over ~1.2 s, dead samples drop out.
    const now = performance.now();
    for (const sm of stirData) sm[2] = 0;
    for (let i = wake.length - 1, n = 0; i >= 0 && n < STIR; i--, n++) {
      const w = wake[i];
      const strength = Math.exp(-((now - w.t) / 1000) * 2.4);
      if (strength < 0.01) {
        wake.splice(0, i + 1);
        break;
      }
      stirData[n][0] = w.x;
      stirData[n][1] = w.y;
      stirData[n][2] = strength;
    }
    field.set({
      params: {
        time: time.time,
        reveal: state.reveal,
        morph: state.morph,
        pointer: [state.px, state.py],
        fade: state.fade,
      },
      stir: { samples: stirData },
    });
    frame.pass(canvasSurface, field);
  };

  if (opts.reducedMotion) {
    // One still frame: the monogram, fully gathered.
    loop = frameLoop(gpu, (frame) => {
      render(frame);
      loop?.stop();
      loop = undefined;
    });
  } else {
    loop = frameLoop(gpu, render);
  }
  opts.onReady?.();

  return {
    setMorph(m) {
      state.morph = Math.max(0, Math.min(1, m));
      if (opts.reducedMotion) {
        // Redraw the still on demand so scroll still re-forms the sky.
        loop?.stop();
        loop = frameLoop(gpu, (frame) => {
          render(frame);
          loop?.stop();
          loop = undefined;
        });
      }
    },
    setPointer(x, y) {
      state.px = x;
      state.py = y;
    },
    stir(x, y) {
      const last = wake[wake.length - 1];
      const now = performance.now();
      // Sample the path no denser than ~25 ms so a slow hover still leaves a wake.
      if (last && now - last.t < 25 && Math.hypot(x - last.x, y - last.y) < 0.02) return;
      wake.push({ x, y, t: now });
      if (wake.length > 40) wake.shift();
    },
    setFade(f) {
      state.fade = f;
    },
    setPaused(paused) {
      if (opts.reducedMotion) return;
      if (paused && loop) {
        loop.stop();
        loop = undefined;
      } else if (!paused && !loop) {
        loop = frameLoop(gpu, render);
      }
      state.paused = paused;
    },
    dispose() {
      loop?.stop();
      stars.destroy();
      gpu.dispose();
    },
  };
}
