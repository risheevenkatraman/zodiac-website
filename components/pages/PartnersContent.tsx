import { asset } from '../../lib/paths';
import HeroLogo from '../HeroLogo';
import PartnershipOrbit from '../PartnershipOrbit';

export default function PartnersContent() {
  const logo = asset('assets/partners/parsertime.png');
  const partners = [
    {
      id: 'partner-0',
      name: 'Parsertime',
      logo,
      logoClass: 'partner-logo partner-logo-parsertime',
      content: (
        <article className="partner">
          <div className="partner-logo partner-logo-parsertime">
            <img src={logo} alt="Parsertime logo" width="200" height="120" />
          </div>
          <div className="partner-copy">
            <h2>Parsertime</h2>
            <p>
              Parsertime is an Overwatch 2 scrim analytics platform that helps players and coaches
              turn match data into actionable insights. Explore player ratings, team performance
              trends, and positional analysis to prepare for your next practice.
            </p>
            <a
              className="text-link"
              href="https://parsertime.app/"
              aria-label="Explore Parsertime's product"
            >
              Explore product <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      ),
    },
  ];
  return (
    <>
      <h1>Our partners</h1>
      <PartnershipOrbit partners={partners} constellation={<HeroLogo artworkOnly />} />
    </>
  );
}
