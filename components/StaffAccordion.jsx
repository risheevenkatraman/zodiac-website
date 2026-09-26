import { asset } from '../lib/paths';
import ProfileSocialLink from './ProfileSocialLink';
import PlayerRole from './PlayerRole';

export default function StaffAccordion({ members, players = false }) {
  return (
    <div className="staff-accordion">
      {members.map((person) => (
        <details
          className="staff-accordion-item"
          name={players ? 'player-profiles' : 'staff-profiles'}
          key={person.id}
        >
          <summary data-player={players ? person.id : undefined}>
            <img
              src={asset(person.image || 'assets/uploads/profile-placeholder.svg')}
              alt=""
              width="64"
              height="64"
              loading="lazy"
            />
            <span className="staff-accordion-heading">
              <span className="staff-accordion-name">{person.name}</span>
              {players ? (
                <PlayerRole player={person} as="span" />
              ) : (
                <span className="staff-accordion-role">{person.role}</span>
              )}
            </span>
            <span className="staff-accordion-indicator" aria-hidden="true" />
          </summary>
          <div className="staff-accordion-profile">
            <section aria-labelledby={`staff-intro-${person.id}`}>
              <h3 id={`staff-intro-${person.id}`}>Introduction</h3>
              <p>{person.introduction || 'A personal introduction is coming soon.'}</p>
            </section>
            <section aria-labelledby={`staff-socials-${person.id}`}>
              <h3 id={`staff-socials-${person.id}`}>Social links</h3>
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
        </details>
      ))}
    </div>
  );
}
