import { siDiscord, siInstagram, siTiktok, siTwitch, siX, siYoutube } from "simple-icons";

const glyphs: Record<string, { path: string; title: string }> = {
  x: { path: siX.path, title: "X" },
  twitter: { path: siX.path, title: "X" },
  twitch: { path: siTwitch.path, title: "Twitch" },
  youtube: { path: siYoutube.path, title: "YouTube" },
  tiktok: { path: siTiktok.path, title: "TikTok" },
  instagram: { path: siInstagram.path, title: "Instagram" },
  discord: { path: siDiscord.path, title: "Discord" },
};

/** Resolve a social label from the data ("X/Twitter", "Twitch", …) to a brand glyph. */
export function socialGlyph(label: string) {
  const key = label.toLowerCase().replace(/[^a-z]/g, "");
  for (const k of Object.keys(glyphs)) if (key.includes(k)) return glyphs[k];
  return null;
}

export function SocialIcon({ label, size = 14, className = "" }: { label: string; size?: number; className?: string }) {
  const g = socialGlyph(label);
  if (!g) return <span className="caps">{label}</span>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={g.title} className={className} fill="currentColor">
      <path d={g.path} />
    </svg>
  );
}
