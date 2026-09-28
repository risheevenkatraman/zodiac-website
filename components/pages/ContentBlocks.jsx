import { readData } from '../../lib/content';
import { asset } from '../../lib/paths';
import Events from '../Events';
import StaffAccordion from '../StaffAccordion';

export function HomeTitle() {
  const { homeTitle } = readData('site');
  return (
    <h1 id="home-title">
      {homeTitle.toLowerCase() === 'written in the stars' ? (
        <>
          <span className="home-title-line">Written in</span>
          <span className="home-title-line">the Stars</span>
        </>
      ) : (
        homeTitle
      )}
    </h1>
  );
}

export function HomeIntroduction() {
  return <p className="hero-intro">{readData('site').homeIntroduction}</p>;
}

export function Announcement() {
  const announcement = readData('announcement');
  return (
    <article id="pinned-announcement" className="announcement-card">
      <img src={asset(announcement.image)} alt="" loading="lazy" />
      <div>
        <p className="eyebrow">Pinned update</p>
        <h4>{announcement.title}</h4>
        <p className="announcement-message">{announcement.message}</p>
      </div>
    </article>
  );
}

export function EventSchedule() {
  return <Events initialEvents={readData('events')} />;
}

export function StaffList() {
  return <StaffAccordion members={readData('staff')} />;
}

export function SocialLinks() {
  return (
    <div className="social-grid">
      {readData('site')
        .socials.filter((social) => social.url.startsWith('https://'))
        .map((social) => (
          <a className="social-card" href={social.url} key={social.url}>
            {social.image && (
              <span className="social-icon">
                <img src={asset(social.image)} alt="" />
              </span>
            )}
            <span>
              <strong>{social.label}</strong>
              <small>{social.description}</small>
            </span>
          </a>
        ))}
    </div>
  );
}
