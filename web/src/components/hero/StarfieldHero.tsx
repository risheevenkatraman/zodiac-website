"use client";

import { useEffect, useRef, useState } from "react";
import type { StarfieldHandle } from "./starfield";

/** Starts are serialized per page so a remount never draws to a canvas the previous instance is tearing down. */
let chain: Promise<unknown> = Promise.resolve();

type Props = {
  /** 0 at rest, 1 fully re-formed into the ring; driven by the pinned scroll */
  progressRef: React.MutableRefObject<number>;
  className?: string;
};

/**
 * Owns the canvas and the WebGPU lifecycle. Falls back to the still monogram
 * where WebGPU is unavailable, and renders a single frame under reduced motion.
 */
export function StarfieldHero({ progressRef, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      queueMicrotask(() => setStatus("fallback"));
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 640px)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // Point budget scales with pixel count, capped for the GPU.
    const count = Math.round(Math.min(small ? 5500 : 13000, (window.innerWidth * window.innerHeight * dpr) / 90));

    let handle: StarfieldHandle | undefined;
    let disposed = false;
    let raf = 0;
    let lastMorph = -1;

    const run = chain
      .then(() => import("./starfield"))
      .then(({ startStarfield }) => {
        if (disposed) return undefined;
        return startStarfield(canvas, {
          count,
          reducedMotion,
          onReady: () => setStatus("ready"),
        });
      })
      .then((h) => {
        if (!h) return;
        if (disposed) return h.dispose();
        handle = h;
        const tick = () => {
          const m = progressRef.current;
          if (m !== lastMorph) {
            handle?.setMorph(m);
            lastMorph = m;
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch((err) => {
        console.error("starfield failed", err);
        setStatus("fallback");
      });
    chain = run;

    const onPointer = (e: PointerEvent) => {
      if (!handle || reducedMotion) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      handle.setPointer(x, y);
      const r = canvas.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        handle.stir(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      }
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const io = new IntersectionObserver(([entry]) => handle?.setPaused(!entry.isIntersecting), { threshold: 0 });
    io.observe(canvas);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      io.disconnect();
      chain = run.then(() => {
        handle?.dispose();
        handle = undefined;
      });
    };
  }, [progressRef]);

  return (
    <div className={className} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="block h-full w-full transition-opacity duration-700 ease-out"
        style={{ opacity: status === "ready" ? 1 : 0 }}
      />
      {status === "fallback" && (
        <div
          className="absolute inset-0 bg-center bg-no-repeat opacity-60"
          style={{ backgroundImage: "url(/marks/monogram.png)", backgroundSize: "min(80vw, 80vh)" }}
        />
      )}
    </div>
  );
}
