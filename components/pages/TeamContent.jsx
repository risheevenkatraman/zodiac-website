import { asset } from '../../lib/paths';
import Roster from '../Roster';
import TeamConstellation from '../TeamConstellation';

export default function TeamContent({ page: { team } }) {
  return (
    <>
      <section className="team-header">
        <img src={asset(team.image)} alt={`${team.name} team logo`} />
        <div>
          <p className="eyebrow">{team.eyebrow}</p>
          <h1>{team.name}</h1>
          <p>{team.description}</p>
        </div>
      </section>
      <TeamConstellation team={team} />
      {team.players.length ? (
        <>
          <h3>Roster</h3>
          <Roster players={team.players} game={team.game} />
        </>
      ) : (
        <section className="coming-soon">
          <h3>Coming soon</h3>
          <p>Roster announcements and competitive updates will be shared here soon.</p>
        </section>
      )}
    </>
  );
}
