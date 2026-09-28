import type { PlayerPage, StaffPage } from '../../lib/types';
import { asset } from '../../lib/paths';
import PageLink from '../PageLink';
import PlayerRole from '../PlayerRole';
import ProfileSocialLink from '../ProfileSocialLink';

export default function ProfileContent({ page }: { page: PlayerPage | StaffPage }) {
  const { person, team } = page;
  const heading = team ? 'player-name' : 'staff-name';
  const introduction =
    person.introduction ||
    (team
      ? `${person.name} plays ${person.role.toLowerCase()} for ${team.name} in ${team.game}. A personal introduction is coming soon.`
      : 'A personal introduction is coming soon.');
  return (
    <>
      <PageLink className="back-link" href={team ? team.page : 'staff.html'}>
        ← Back to {team ? `${team.name} · ${team.game}` : 'Staff'}
      </PageLink>
      <section className="team-header player-header" aria-labelledby={heading}>
        <img
          src={asset(person.image || 'assets/uploads/profile-placeholder.svg')}
          alt=""
          width="112"
          height="112"
        />
        <div>
          <p className="eyebrow">
            {team ? `${team.game} · ${team.name}` : 'Zodiac Esports · Staff'}
          </p>
          <h1 id={heading}>{person.name}</h1>
          {page.kind === 'player' ? (
            <PlayerRole player={page.person} />
          ) : (
            <p className="role">{person.role}</p>
          )}
        </div>
      </section>
      <div className="profile-sections">
        <section className="profile-section" aria-labelledby="intro-heading">
          <h2 id="intro-heading">Introduction</h2>
          <p>{introduction}</p>
        </section>
        <section className="profile-section" aria-labelledby="social-heading">
          <h2 id="social-heading">Social links</h2>
          <div className="player-socials">
            {person.socials?.length ? (
              person.socials.map((social) => (
                <ProfileSocialLink key={social.url} url={social.url} label={social.label} />
              ))
            ) : (
              <p className="empty-state">Social links haven’t been shared yet.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
