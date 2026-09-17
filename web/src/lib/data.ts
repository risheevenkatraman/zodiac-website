import players from "@/data/players.json";
import staff from "@/data/staff.json";
import events from "@/data/events.json";
import site from "@/data/site.json";
import matchSources from "@/data/match_sources.json";

export type Social = { label: string; url: string };
export type Player = {
  id: string;
  name: string;
  role: string;
  introduction?: string;
  socials?: Social[];
  signature?: { name: string; image: string };
  image?: string;
};
export type Team = {
  page: string;
  name: string;
  game: "Overwatch" | "VALORANT";
  players: Player[];
};

const slugs: Record<string, string> = {
  Zodiac: "zodiac",
  Piggies: "piggies",
  Ox: "ox",
  Goats: "goats",
  Tigers: "tigers",
};
const marks: Record<string, string> = {
  Zodiac: "/marks/monogram.png",
  Piggies: "/marks/pig.png",
  Ox: "/marks/ox.png",
  Goats: "/marks/goat.png",
  Tigers: "/marks/tiger.png",
};
/** Ring position: thirty degrees apart counter-clockwise from the top, the Tiger at the top; the flagship holds the centre. */
const houseIndex: Record<string, number | "centre"> = {
  Zodiac: "centre",
  Tigers: 0,
  Ox: 1,
  Goats: 4,
  Piggies: 8,
};
export const numerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
export const storeUrl = "https://zodiacesports.myshopify.com";

const houses: Record<string, string> = {
  Zodiac: "The flagship",
  Piggies: "House of the Pig",
  Ox: "House of the Ox",
  Goats: "House of the Goat",
  Tigers: "House of the Tiger",
};

export const isOpenSlot = (p: Player) => /placeholder/i.test(p.name);

export const teams = (players as Team[]).map((t, i) => ({
  ...t,
  slug: slugs[t.name] ?? t.name.toLowerCase(),
  mark: marks[t.name] ?? "/marks/monogram.png",
  house: houses[t.name] ?? t.name,
  houseIndex: houseIndex[t.name] ?? "centre",
  numeral: numerals[i] ?? String(i + 1),
  schedule: (matchSources as { team: string; schedule_url?: string; season?: number }[]).find(
    (m) => m.team === t.name,
  ),
}));

export type Staff = {
  id: string;
  name: string;
  role: string;
  image?: string;
  introduction?: string;
  socials?: Social[];
};
export const staffList = staff as Staff[];
export const founder = staffList.find((s) => s.role.toLowerCase().includes("founder"));

export const siteInfo = site as {
  homeTitle: string;
  homeIntroduction: string;
  socials: { label: string; description: string; url: string }[];
};
export const discordUrl = siteInfo.socials.find((s) => s.label.toLowerCase().includes("discord"))?.url ?? "#";
export const xUrl = siteInfo.socials.find((s) => s.label.toLowerCase().includes("x"))?.url ?? "#";

type EventRecord = { name: string; description: string; date: string; team?: string };
export type Match = { date: string; team: string; opponent: string; league: string; game: string };

/** Fixtures in the shape the FACEIT sync writes: "Game — FACEIT S10 NA Advanced Central - Regular Season" / "Team vs Opponent". */
export const matches: Match[] = (events as EventRecord[])
  .flatMap((e) => {
    const vs = e.description.match(/^(.+?)\s+vs\s+(.+)$/i);
    if (!vs) return [];
    const [game, competition = ""] = e.name.split(" — ");
    const league = competition.replace(/^FACEIT\s+/, "").replace(/\s+-\s+Regular Season$/, "");
    return [{ date: e.date, team: e.team ?? vs[1].trim(), opponent: vs[2].trim(), league, game: game.trim() }];
  })
  .sort((a, b) => a.date.localeCompare(b.date) || a.team.localeCompare(b.team));

export const matchesFor = (team: string) => matches.filter((m) => m.team === team);

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function matchDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getUTCDay()];
  return { month: monthNames[m - 1], day: String(d), weekday, iso };
}

export const starsTiers = [
  { name: "Bronze", color: "var(--color-bronze)" },
  { name: "Silver", color: "var(--color-silver)" },
  { name: "Gold", color: "var(--color-gold)" },
  { name: "Diamond", color: "var(--color-diamond)" },
  { name: "Nebula", color: "linear-gradient(90deg, var(--color-ink), #c46bd6)" },
];

/** Resolve a legacy `assets/...` path from the JSON to the app's public folder. */
export function asset(path?: string): string {
  if (!path) return "/assets/profile-placeholder.svg";
  const file = path.replace(/^assets\/(uploads\/)?/, "");
  return `/assets/${file}`;
}
