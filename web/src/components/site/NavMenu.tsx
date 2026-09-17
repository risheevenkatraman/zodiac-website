"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { StarGlyph } from "./StarGlyph";

/** The small-screen menu: a panel of star labels under the ecliptic. */
export function NavMenu({ links, discordUrl }: { links: { href: string; label: string; external?: boolean }[]; discordUrl: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="pill-press caps hairline rounded-full border px-4 py-2 text-starlight hover:border-lavender"
      >
        {open ? "Close" : "Menu"}
      </button>
      <div
        id={id}
        data-open={open || undefined}
        inert={!open || undefined}
        className="nav-panel fixed inset-x-0 top-20 bottom-0 z-40 bg-sky/97 px-5 pt-8"
      >
        <nav aria-label="Main" className="flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="hairline flex items-center gap-4 border-b py-5 font-display text-2xl uppercase tracking-[0.08em] text-starlight no-underline"
            >
              <StarGlyph size={10} className="text-ink" />
              {l.label}
            </Link>
          ))}
          <a href={discordUrl} target="_blank" rel="noreferrer" className="pill-press caps mt-8 inline-flex w-fit rounded-full bg-ink px-6 py-3.5 text-white no-underline">
            Join the Discord
          </a>
        </nav>
      </div>
    </div>
  );
}
