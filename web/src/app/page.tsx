import Image from "next/image";
import { HeroScene } from "@/components/hero/HeroScene";
import { HouseRing } from "@/components/site/HouseRing";
import { StarGlyph } from "@/components/site/StarGlyph";
import { TeamPlate, type PlateTeam } from "@/components/site/TeamPlate";
import { asset, discordUrl, founder, isOpenSlot, matchDate, matches, matchesFor, numerals, staffList, starsTiers, storeUrl, teams, xUrl } from "@/lib/data";
import { StaffList } from "@/components/site/StaffList";
import { HorizonBand } from "@/components/site/HorizonBand";

const plates: PlateTeam[] = teams.map((t) => ({
  slug: t.slug,
  name: t.name,
  house: t.house,
  numeral: t.numeral,
  game: t.game,
  mark: t.mark,
  season: t.schedule?.season,
  scheduleUrl: t.schedule?.schedule_url,
  matches: matchesFor(t.name).slice(0, 4).map((m) => ({ ...matchDate(m.date), opponent: m.opponent, league: m.league })),
  roster: t.players.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    image: asset(p.image),
    open: isOpenSlot(p),
    signature: p.signature ? { name: p.signature.name, image: asset(p.signature.image) } : undefined,
    social: p.socials?.[0] ? { label: p.socials[0].label.replace("/Twitter", ""), url: p.socials[0].url } : undefined,
  })),
}));

export default function Home() {
  const overwatch = teams.filter((t) => t.game === "Overwatch" && t.schedule?.schedule_url);
  const season = overwatch[0]?.schedule?.season;

  return (
    <main id="main">
      <HeroScene teams={teams.map((t) => ({ name: t.name, slug: t.slug, game: t.game }))} discordUrl={discordUrl} />

      {/* The houses */}
      <section id="teams" className="mx-auto max-w-[1280px] px-5 py-28 sm:px-8 md:py-40">
        <div className="hairline rule-draw border-t" />
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px] md:items-center">
          <div>
            <h2 className="display-caps text-[clamp(1.9rem,4vw,3.4rem)]">
              Five rosters,
              <br />
              drawn from twelve houses
            </h2>
            <p className="mt-6 max-w-[44ch] text-lavender">
              Every Zodiac team takes an animal of the zodiac. Four rosters compete in Overwatch, one in VALORANT, and players move between houses as they grow.
            </p>
          </div>
          <HouseRing
            className="mx-auto h-72 w-72 md:h-80 md:w-80"
            houses={teams.map((t) => ({ name: t.name, slug: t.slug, numeral: t.numeral, index: t.houseIndex }))}
          />
        </div>

        <ol className="mt-16 grid gap-px">
          {plates.map((team, i) => (
            <TeamPlate key={team.slug} team={team} seed={i + 1} />
          ))}
        </ol>
      </section>

      {/* Matches: the calendar */}
      <section id="matches" className="mx-auto max-w-[1280px] scroll-mt-20 px-5 pb-28 sm:px-8 md:pb-40">
        <div className="hairline border-t" />
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="display-caps text-[clamp(1.9rem,4vw,3.4rem)]">On the calendar</h2>
            <p className="mt-4 max-w-[40ch] text-lavender">
              {season ? `Our Overwatch rosters play FACEIT League Season ${season}.` : "Our Overwatch rosters play in FACEIT leagues."} Fixtures are synced from FACEIT; results are posted on X as matches finish.
            </p>
            <ul className="mt-8 grid gap-2">
              {overwatch.map((t) => (
                <li key={t.slug}>
                  <a href={t.schedule!.schedule_url} target="_blank" rel="noreferrer" className="caps inline-flex items-center gap-2 text-lavender no-underline hover:text-starlight">
                    <StarGlyph size={8} className="text-ink" /> {t.name} on FACEIT
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <ol className="relative grid gap-px border-l pl-8 hairline">
            {matches.map((m, i) => {
              const d = matchDate(m.date);
              const newDay = i === 0 || matches[i - 1].date !== m.date;
              return (
                <li key={`${m.date}-${m.team}-${m.opponent}`} className={`relative grid grid-cols-[6.5rem_1fr] items-baseline gap-5 py-4 ${newDay ? "hairline border-t" : ""}`}>
                  {newDay && <StarGlyph size={11} className="absolute -left-[2.35rem] top-5 text-starlight" />}
                  <span className="caps text-lavender/80">{newDay ? `${d.weekday} ${d.month} ${d.day}` : ""}</span>
                  <span className="min-w-0">
                    <span className="block text-lg text-starlight">
                      {m.team} <span className="text-lavender/70">vs</span> {m.opponent}
                    </span>
                    <span className="block text-sm text-lavender/75">
                      {m.game} · {m.league}
                    </span>
                  </span>
                </li>
              );
            })}
            {matches.length === 0 && <li className="py-4 text-lavender/75">No fixtures on the calendar yet.</li>}
          </ol>
        </div>
      </section>

      {/* The plate — engraved paper for reading. The sky lightens into it like dawn, and back out after. */}
      <section id="about" className="plate">
        <HorizonBand className="h-56 md:h-80" />
        <div className="mx-auto grid max-w-[1280px] gap-14 px-5 pb-28 pt-10 sm:px-8 md:grid-cols-[1.1fr_1fr] md:pb-40 md:pt-16">
          <div>
            <div className="hairline-plate border-t" />
            <h2 className="display-caps mt-8 text-[clamp(1.9rem,4vw,3.4rem)] text-plate-ink">Built by players, for the scene</h2>
            {founder && (
              <figure className="mt-10">
                <blockquote className="font-text text-[1.35rem] leading-[1.45] text-plate-ink md:text-2xl">
                  “{founder.introduction?.trim()}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-4">
                  <span className="relative h-12 w-12 overflow-hidden rounded-full bg-ink/20">
                    <Image src={asset(founder.image)} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span>
                    <span className="block font-medium text-plate-ink">{founder.name}</span>
                    <span className="caps text-plate-muted">{founder.role}</span>
                  </span>
                </figcaption>
              </figure>
            )}
          </div>
          <div className="md:pt-20">
            <h3 className="font-text italic text-xl text-plate-ink">The staff</h3>
            <StaffList staff={staffList} />
          </div>
        </div>

        {/* Stars */}
        <div id="stars" className="hairline-plate scroll-mt-20 border-t">
          <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 md:py-32">
            <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="display-caps text-[clamp(1.9rem,4vw,3.4rem)] text-plate-ink">Stars, the loyalty program</h2>
                <p className="mt-5 max-w-[46ch] text-plate-ink/80">
                  Every eligible purchase in the Zodiac store earns Stars. Redeem them for single-use discount codes, and climb five lifetime tiers that never reset when you spend.
                </p>
                <a href={storeUrl} target="_blank" rel="noreferrer" className="caps mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-white no-underline hover:bg-ink-deep">
                  Visit the store
                </a>
              </div>
              <ol className="grid content-start gap-px">
                {starsTiers.map((tier, i) => (
                  <li key={tier.name} className="hairline-plate flex items-center gap-5 border-t py-4">
                    <span className="font-text w-8 italic text-plate-muted">{numerals[i]}</span>
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: tier.color }} aria-hidden="true" />
                    <span className="display-caps text-xl text-plate-ink">Zodiac {tier.name}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <HorizonBand dusk className="h-48 md:h-72" />
      </section>

      {/* Community */}
      <section id="community" className="mx-auto max-w-[1280px] scroll-mt-20 px-5 py-28 sm:px-8 md:py-40">
        <div className="hairline border-t" />
        <div className="mt-8 grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end">
          <h2 className="display-caps text-[clamp(2rem,5vw,4.2rem)]">
            The sky is
            <br />
            better shared
          </h2>
          <div>
            <p className="max-w-[40ch] text-lavender">
              Match nights, community events, and roster news happen in the Discord first. Follow on X for results and announcements.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={discordUrl} target="_blank" rel="noreferrer" className="caps rounded-full bg-ink px-6 py-3.5 text-white no-underline hover:bg-[#7d4dba]">
                Join the Discord
              </a>
              <a href={xUrl} target="_blank" rel="noreferrer" className="caps hairline rounded-full border px-6 py-3.5 text-starlight no-underline hover:border-lavender">
                Follow on X
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
