import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Libre_Caslon_Display, Libre_Caslon_Text } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

const caslonDisplay = Libre_Caslon_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-caslon-display",
  display: "swap",
});
const caslonText = Libre_Caslon_Text({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-caslon-text",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const DIRECTION_CONTRACT = `<!--
IMPECCABLE DIRECTION CONTRACT — seed c1acbc64 — The Celestial Atlas
WORLD: Flamsteed/Bode star atlases on a night sky. Sky #0B0716, ink purple #6F3FA5, lavender hairlines, starlight text; cream plates for Read surfaces. Libre Caslon spaced caps, Hanken Grotesk UI.
FIRST VIEWPORT: full-height sky; a vgpu point cloud sampled from the Z monogram, offset from the headline; WRITTEN IN THE STARS; Discord and Teams actions; the five rosters as a legend on the horizon.
VISITOR PATH: hero, the cloud re-forms into the ring of twelve on scroll (a small monogram holds the centre; the four active houses are lit in their real team-logo colours, orange Tigers, blue Ox, silver Goats, pink Piggies, an addition the user reviewed on 2026-09-17), house ring, team plates, FACEIT schedule, founder plate, Stars tiers, community.
SIGNATURE: the scroll-pinned morph from monogram to ring; each team drawn as its animal's constellation with players as named stars.
RISK: the literal reading of the motto; it must stay committed and never drift into generic dark space.
-->`;

export const metadata: Metadata = {
  title: "Zodiac Esports",
  description:
    "Zodiac Esports is a grassroots, community-driven organization fielding five rosters across Overwatch and VALORANT. Written in the stars, est. 2024.",
  openGraph: {
    title: "Zodiac Esports",
    description: "Written in the stars. Five rosters across Overwatch and VALORANT, est. 2024.",
    images: ["/assets/zodiac-banner.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0716",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caslonDisplay.variable} ${caslonText.variable} ${hanken.variable}`}>
      <body className="min-h-svh bg-sky text-starlight font-sans">
        {/* The direction contract must survive the production build as a real HTML comment, so it is emitted, not a JSX comment. */}
        <div hidden data-impeccable-contract="" dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
