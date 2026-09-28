export interface SocialLink {
  label: string;
  url: string;
}
export interface Person {
  id: string;
  name: string;
  role: string;
  image?: string;
  introduction?: string;
  socials?: SocialLink[];
}
export interface Player extends Person {
  signature: { name: string; image: string };
}
export interface RosterData {
  page: string;
  name: string;
  game: string;
  players: Player[];
}
export interface TeamInfo {
  page: string;
  name: string;
  game: string;
  image: string;
  eyebrow: string;
  description: string;
  title: string;
}
export interface Team extends TeamInfo {
  players: Player[];
}
export interface CalendarEvent {
  name: string;
  description: string;
  date: string;
}
export interface ParsedEvent extends CalendarEvent {
  value: Date;
}
export interface PageInfo {
  file: string;
  title: string;
  description?: string;
  bodyClass?: string;
}
export type StaticPageKind =
  | 'index'
  | 'teams'
  | 'staff'
  | 'partnerships'
  | 'socials'
  | 'store'
  | 'account';
export interface StaticPage extends PageInfo {
  kind: StaticPageKind;
  team?: never;
  person?: never;
}
export interface TeamPage extends PageInfo {
  kind: 'team';
  team: Team;
  person?: never;
}
export interface PlayerPage extends PageInfo {
  kind: 'player';
  person: Player;
  team: Team;
}
export interface StaffPage extends PageInfo {
  kind: 'staff-profile';
  person: Person;
  team?: never;
}
export type Page = StaticPage | TeamPage | PlayerPage | StaffPage;
export interface ContentData {
  site: {
    homeTitle: string;
    homeIntroduction: string;
    socials: (SocialLink & { description: string; image?: string })[];
  };
  announcement: { title: string; message: string; image: string };
  events: CalendarEvent[];
  players: RosterData[];
  staff: Person[];
  teams: TeamInfo[];
  pages: Record<string, Omit<PageInfo, 'file'>>;
}
