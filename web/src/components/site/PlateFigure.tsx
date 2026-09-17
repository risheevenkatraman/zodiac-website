"use client";

import { useEffect, useRef, useState } from "react";

/** The engraved figure of a plate, rendered by the shared plate shader; falls back to the mark image. */
export function PlateFigure({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      queueMicrotask(() => setFallback(true));
      return;
    }
    let dispose: (() => void) | undefined;
    let gone = false;
    const run = import("./figure")
      .then(({ startFigureSerialized }) => startFigureSerialized(canvas, src, () => gone))
      .then((d) => {
        if (!d) return;
        if (gone) d();
        else dispose = d;
      })
      .catch((err) => {
        console.error("figure failed", err);
        setFallback(true);
      });
    return () => {
      gone = true;
      void run.then(() => dispose?.());
    };
  }, [src]);

  return (
    <div className={className} aria-hidden="true">
      <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
      {fallback && (
        <div
          className="absolute inset-0 bg-center bg-no-repeat opacity-80"
          style={{ backgroundImage: `url(${src})`, backgroundSize: "60%" }}
        />
      )}
    </div>
  );
}
