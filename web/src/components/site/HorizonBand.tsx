"use client";

import { useEffect, useRef, useState } from "react";
import type { HorizonHandle } from "./horizon";
import { Constellation } from "./Constellation";

const chains = new WeakMap<HTMLCanvasElement, Promise<unknown>>();

/** Dawn (sky → plate) or dusk (plate → sky) horizon; the sun rises or sets as the band scrolls through the viewport. */
export function HorizonBand({ dusk = false, className = "" }: { dusk?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      queueMicrotask(() => setFallback(true));
      return;
    }
    let gone = false;
    let handle: HorizonHandle | undefined;
    const prev = chains.get(canvas) ?? Promise.resolve();
    const run = prev
      .then(() => import("./horizon"))
      .then(({ startHorizon }) => (gone ? undefined : startHorizon(canvas, dusk)))
      .then((h) => {
        if (!h) return;
        if (gone) return h.dispose();
        handle = h;
        onScroll();
      })
      .catch((err) => {
        console.error("horizon failed", err);
        setFallback(true);
      });
    chains.set(canvas, run.catch(() => undefined));

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!handle) return;
        const r = canvas.getBoundingClientRect();
        // 0 when the band's top touches the viewport bottom, 1 when its bottom reaches the viewport's upper third.
        const p = (window.innerHeight - r.top) / (window.innerHeight * 0.66 + r.height);
        handle.setRise(Math.max(0, Math.min(1, p)));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(([e]) => handle?.setVisible(e.isIntersecting), { rootMargin: "20% 0px" });
    io.observe(canvas);

    return () => {
      gone = true;
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      io.disconnect();
      chains.set(canvas, run.then(() => handle?.dispose()));
    };
  }, [dusk]);

  const gradient = dusk
    ? "linear-gradient(to bottom, var(--color-plate) 0%, color-mix(in oklab, var(--color-sky) 55%, var(--color-plate)) 55%, var(--color-sky) 100%)"
    : "linear-gradient(to bottom, var(--color-sky) 0%, color-mix(in oklab, var(--color-sky) 55%, var(--color-plate)) 45%, var(--color-plate) 100%)";

  // Constellations drifting through the twilight: a few houses, faint and pulsing out of step.
  // Placed in each band's night half: the upper part at dawn, the lower part at dusk.
  const houses = dusk
    ? [
        { src: "/marks/tiger.png", left: "6%", top: "48%", delay: "0s", seed: 21 },
        { src: "/marks/goat.png", left: "34%", top: "56%", delay: "-3.5s", seed: 22 },
        { src: "/marks/ox.png", left: "60%", top: "46%", delay: "-7s", seed: 23 },
        { src: "/marks/pig.png", left: "84%", top: "58%", delay: "-5s", seed: 24 },
      ]
    : [
        { src: "/marks/pig.png", left: "4%", top: "-4%", delay: "0s", seed: 31 },
        { src: "/marks/ox.png", left: "30%", top: "6%", delay: "-4s", seed: 32 },
        { src: "/marks/tiger.png", left: "54%", top: "-6%", delay: "-8s", seed: 33 },
        { src: "/marks/goat.png", left: "82%", top: "4%", delay: "-2s", seed: 34 },
      ];

  return (
    <div className={`relative overflow-hidden bg-sky ${className}`} aria-hidden="true" style={{ background: fallback ? gradient : undefined }}>
      <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
      {houses.map((h) => (
        <div
          key={h.src}
          className="constellation-pulse absolute w-44 text-starlight md:w-64"
          style={{ left: h.left, top: h.top, animationDelay: h.delay }}
        >
          <Constellation src={h.src} stars={26} seed={h.seed} className="h-auto w-full" />
        </div>
      ))}
    </div>
  );
}
