import { init } from "vgpu";
import type { Gpu } from "vgpu";

/** One WebGPU device shared by every secondary scene on the page (plate figures, horizon bands). */
let shared: Promise<{ gpu: Gpu; motion: number }> | null = null;
export function getSharedGpu() {
  if (!shared) {
    shared = (async () => {
      const gpu = await init();
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;
      return { gpu, motion };
    })();
  }
  return shared;
}
