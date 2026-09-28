import site from '../data/site.json';
import announcement from '../data/announcement.json';
import events from '../data/events.json';
import players from '../data/players.json';
import staff from '../data/staff.json';
import teams from '../data/teams.json';
import pages from '../data/pages.json';
import type { ContentData } from './types';

// Check the actual CMS files, not just the types promised by the filesystem reader.
// Next reloads these imports when content changes during development.
const content: ContentData = { site, announcement, events, players, staff, teams, pages };
export default content;
