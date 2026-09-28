import HomeContent from './HomeContent';
import TeamsContent from './TeamsContent';
import StaffContent from './StaffContent';
import PartnersContent from './PartnersContent';
import SocialsContent from './SocialsContent';
import StoreContent from './StoreContent';
import AccountContent from './AccountContent';
import TeamContent from './TeamContent';
import ProfileContent from './ProfileContent';

const components = {
  index: HomeContent,
  teams: TeamsContent,
  staff: StaffContent,
  partnerships: PartnersContent,
  socials: SocialsContent,
  store: StoreContent,
  account: AccountContent,
  team: TeamContent,
  player: ProfileContent,
  'staff-profile': ProfileContent,
};

export default function PageContent({ page }) {
  const Content = components[page.kind];
  return <Content page={page} />;
}
