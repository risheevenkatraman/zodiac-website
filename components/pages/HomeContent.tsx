import { HomeTitle, HomeIntroduction, Announcement, EventSchedule } from './ContentBlocks';
import PageLink from '../PageLink';
import HeroLogo from '../HeroLogo';
import HomeTeams from '../HomeTeams';
import AtmosphereStars from '../AtmosphereStars';

export default function HomeContent() {
  return (
    <>
      <section className="hero home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <span className="eyebrow">
            <span aria-hidden="true">✦</span> A different kind of constellation
          </span>
          <HomeTitle />
          <HomeIntroduction />
          <div className="hero-actions">
            <PageLink className="button button-dark" href="teams.html">
              Meet the teams <span aria-hidden="true">↗</span>
            </PageLink>
            <PageLink className="button button-outline" href="https://discord.gg/R7ZJb4syjq">
              Find your people <span aria-hidden="true">↗</span>
            </PageLink>
          </div>
          <span className="hero-footnote">
            Est. 2024. Built by players. Connected by something bigger.
          </span>
        </div>
        <HeroLogo />
      </section>

      <div className="brand-strip" aria-label="Zodiac community">
        <span>Zodiac Esports</span>
        <span className="brand-strip-star" aria-hidden="true">
          ✦
        </span>
        <span>Destined for Victory</span>
        <span className="brand-strip-star" aria-hidden="true">
          ✦
        </span>
        <span>One constellation. All Zodiac.</span>
      </div>

      <section className="home-teams" id="our-teams" aria-labelledby="teams-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">01 / The constellation</span>
            <h2 id="teams-heading">
              Different teams.
              <br />
              Same stars.
            </h2>
            <p>Find your roster. Follow the climb. Be part of the story.</p>
          </div>
          <PageLink className="text-link" href="teams.html">
            Explore all rosters <span aria-hidden="true">↗</span>
          </PageLink>
        </div>
        <HomeTeams />
      </section>

      <section className="manifesto" aria-labelledby="manifesto-heading">
        <span className="eyebrow">The people behind the name</span>
        <h2 id="manifesto-heading">
          More than a tag.
          <br />
          <span>A place to belong.</span>
        </h2>
        <div>
          <p>
            The late-night queues. The comeback nobody saw coming. The people who keep showing up.
            That's what makes us Zodiac.
          </p>
          <p>
            We compete together, grow together, and make room for the next player with something to
            prove.
          </p>
          <PageLink className="text-link" href="staff.html">
            Meet the people behind Zodiac <span aria-hidden="true">↗</span>
          </PageLink>
        </div>
      </section>

      <section className="manifesto home-partners" aria-labelledby="partners-heading">
        <span className="eyebrow">Our partners / Part of our constellation</span>
        <h2 id="partners-heading">
          Brighter stars.
          <br />
          <span>Shared ambition.</span>
        </h2>
        <div className="home-partners-copy">
          <p>
            Every star adds something to the constellation. Meet the partners alongside Zodiac and
            discover what they bring to the game.
          </p>
          <PageLink className="button button-dark" href="partnerships.html">
            Meet our partners <span aria-hidden="true">↗</span>
          </PageLink>
        </div>
      </section>

      <div className="home-atmosphere">
        <AtmosphereStars edge="top" />
        <section className="announcement">
          <div className="section-heading">
            <div>
              <span className="eyebrow">02 / In our orbit</span>
              <h2>Latest from Zodiac</h2>
              <p>The news, the milestones, and what comes next.</p>
            </div>
          </div>
          <Announcement />
        </section>

        <section className="events" id="matches">
          <div className="section-heading">
            <div>
              <span className="eyebrow">03 / Show up. Make noise.</span>
              <h2>On the calendar</h2>
              <p>Match days and community nights. We'll see you there.</p>
            </div>
          </div>
          <EventSchedule />
        </section>
        <AtmosphereStars edge="bottom" />
      </div>
      <section className="community-banner" aria-labelledby="community-heading">
        <span className="eyebrow">There's a place for you here</span>
        <h2 id="community-heading">
          The sky is better
          <br />
          <em>with you in it.</em>
        </h2>
        <p>Come for the games. Stay for the people.</p>
        <PageLink className="button button-dark" href="https://discord.gg/R7ZJb4syjq">
          Join our Discord <span aria-hidden="true">↗</span>
        </PageLink>
        <PageLink className="community-secondary" href="account.html">
          Rep Zodiac. Earn Stars. ↗
        </PageLink>
        <span className="community-star" aria-hidden="true">
          ✦
        </span>
      </section>
    </>
  );
}
