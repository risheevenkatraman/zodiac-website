import Link from "next/link";
import { discordUrl, storeUrl, xUrl } from "@/lib/data";
import { StarGlyph } from "./StarGlyph";
import { SocialIcon } from "./SocialIcon";

export function Footer() {
  return (
    <footer className="hairline border-t">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display-caps text-2xl">Zodiac Esports</p>
          <p className="mt-3 max-w-[38ch] text-lavender">Written in the stars. A grassroots organization competing in Overwatch and VALORANT since 2024.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-3">
          {[
            ["/#teams", "Teams"],
            ["/#matches", "Matches"],
            ["/#stars", "Stars"],
            [storeUrl, "Store"],
            ["/#community", "Community"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="caps flex items-center gap-2 text-lavender no-underline hover:text-starlight">
              <StarGlyph size={8} className="text-ink" /> {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3">
          <a href={xUrl} target="_blank" rel="noreferrer" className="caps flex items-center gap-2 text-lavender no-underline hover:text-starlight">
            <SocialIcon label="x" size={12} /> X / Twitter
          </a>
          <a href={discordUrl} target="_blank" rel="noreferrer" className="caps flex items-center gap-2 text-lavender no-underline hover:text-starlight">
            <SocialIcon label="discord" size={12} /> Discord
          </a>
        </div>
      </div>
      <div className="hairline border-t">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-6 text-xs leading-relaxed text-lavender/70 sm:px-8 md:flex-row md:justify-between">
          <p>© Zodiac Esports, est. 2024. All rights reserved.</p>
          <p className="max-w-[70ch]">Overwatch and its hero icons are property of Blizzard Entertainment. VALORANT and its agent icons are property of Riot Games. Used here for non-commercial purposes only.</p>
        </div>
      </div>
    </footer>
  );
}
