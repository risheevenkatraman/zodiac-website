import Link from "next/link";

export type House = { name: string; slug: string; numeral: string; index: number | "centre" };

/**
 * The twelve houses as a hairline ring, thirty degrees apart with the Tiger at
 * the top; the active houses are lit and numbered, the flagship holds the centre.
 * This is the section's compositional arc, the same geometry the hero morphs into.
 */
export function HouseRing({ houses, className = "" }: { houses: House[]; className?: string }) {
  const R = 118;
  const pos = (k: number) => {
    const a = (Math.PI / 2) + (k * Math.PI) / 6; // counter-clockwise from the top
    return { x: 150 + R * Math.cos(a), y: 150 - R * Math.sin(a) };
  };
  return (
    <svg viewBox="-50 -30 400 360" className={className} role="img" aria-label="The twelve houses; the five active rosters are lit">
      <circle cx="150" cy="150" r={R} fill="none" stroke="var(--color-lavender)" strokeOpacity="0.28" strokeWidth="1" />
      {Array.from({ length: 12 }, (_, k) => {
        const p = pos(k);
        return <circle key={k} cx={p.x} cy={p.y} r="2" fill="var(--color-lavender)" fillOpacity="0.5" />;
      })}
      {houses.map((h) => {
        const p = h.index === "centre" ? { x: 150, y: 150 } : pos(h.index);
        const labelDx = h.index === "centre" ? 0 : (p.x - 150) * 0.28;
        const labelDy = h.index === "centre" ? 22 : (p.y - 150) * 0.28;
        return (
          <Link key={h.slug} href={`#team-${h.slug}`} className="group">
            <circle cx={p.x} cy={p.y} r="4.5" fill="var(--color-starlight)" className="transition-[r] group-hover:[r:6]" />
            <text
              x={p.x + labelDx}
              y={p.y + labelDy + 3}
              textAnchor="middle"
              fontSize="12"
              fontStyle="italic"
              fontFamily="var(--font-text)"
              fill="var(--color-lavender)"
              className="group-hover:fill-[var(--color-starlight)]"
            >
              {h.numeral} · {h.name}
            </text>
          </Link>
        );
      })}
    </svg>
  );
}
