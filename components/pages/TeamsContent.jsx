import { asset } from '../../lib/paths';
import PageLink from '../PageLink';

export default function TeamsContent() {
  return (
    <>
      <h1>Our Teams</h1>
      <p>Our flagship and academy rosters across Overwatch and VALORANT.</p>

      <section>
        <h3>Overwatch</h3>
        <div className="team-grid">
          <PageLink className="team-card" href="teams/overwatch-team1.html">
            <img src={asset('assets/uploads/zodiac-logo.png')} alt="Zodiac team logo" />
            <h4>Zodiac</h4>
            <p>Flagship team</p>
          </PageLink>
          <PageLink className="team-card" href="teams/overwatch-team5.html">
            <img src={asset('assets/uploads/monkey-logo.png')} alt="Monkeys team logo" />
            <h4>Monkeys</h4>
            <p>Academy team</p>
          </PageLink>
          <PageLink className="team-card" href="teams/overwatch-team2.html">
            <img src={asset('assets/uploads/piggies-logo.png')} alt="Piggies team logo" />
            <h4>Piggies</h4>
            <p>Academy team</p>
          </PageLink>
          <PageLink className="team-card" href="teams/overwatch-team3.html">
            <img src={asset('assets/uploads/ox-logo.png')} alt="Ox team logo" />
            <h4>Ox</h4>
            <p>Academy team</p>
          </PageLink>
          <PageLink className="team-card" href="teams/overwatch-team4.html">
            <img src={asset('assets/uploads/goats-logo.png')} alt="Goats team logo" />
            <h4>Goats</h4>
            <p>Academy team</p>
          </PageLink>
        </div>
      </section>

      <section>
        <h3>VALORANT</h3>
        <div className="team-grid">
          <PageLink className="team-card" href="teams/valorant-team1.html">
            <img src={asset('assets/uploads/zodiac-logo.png')} alt="Zodiac team logo" />
            <h4>Zodiac</h4>
            <p>Flagship team</p>
          </PageLink>
          <PageLink className="team-card" href="teams/valorant-team2.html">
            <img src={asset('assets/uploads/tigers-logo.png')} alt="Tigers team logo" />
            <h4>Tigers</h4>
            <p>Academy team</p>
          </PageLink>
        </div>
      </section>
    </>
  );
}
