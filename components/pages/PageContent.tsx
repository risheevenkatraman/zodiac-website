import type { Page } from '../../lib/types';
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
};

export default function PageContent({ page }: { page: Page }) {
  if (page.kind === 'team') return <TeamContent page={page} />;
  if (page.kind === 'player' || page.kind === 'staff-profile')
    return <ProfileContent page={page} />;
  const Content = components[page.kind];
  return <Content />;
}
