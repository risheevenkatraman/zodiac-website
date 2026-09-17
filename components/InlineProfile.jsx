import { asset } from '../lib/paths';
import ProfileSocialLink from './ProfileSocialLink';
import PlayerRole from './PlayerRole';

export default function InlineProfile({ person, game, staff, onBack }) {
  return (
    <article className="inline-profile" aria-labelledby="selected-profile-name">
      <button className="back-link" type="button" onClick={onBack}>
        &larr; Back to {staff ? 'staff' : 'roster'}
      </button>
      <header className="team-header player-header">
        <img
          src={asset(person.image || 'assets/profile-placeholder.svg')}
          alt=""
          width="112"
          height="112"
        />
        <div>
          <p className="eyebrow">{staff ? 'Zodiac staff' : game}</p>
          <h2 id="selected-profile-name" tabIndex="-1">
            {person.name}
          </h2>
          {staff ? <p className="role">{person.role}</p> : <PlayerRole player={person} />}
        </div>
      </header>
      <div className="profile-sections">
        <section className="profile-section">
          <h3>Introduction</h3>
          <p>{person.introduction || 'A personal introduction is coming soon.'}</p>
        </section>
        <section className="profile-section">
          <h3>Social links</h3>
          <div className="player-socials">
            {person.socials?.length ? (
              person.socials.map((social) => (
                <ProfileSocialLink key={social.url} url={social.url} label={social.label} />
              ))
            ) : (
              <p>Social links haven’t been shared yet.</p>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
