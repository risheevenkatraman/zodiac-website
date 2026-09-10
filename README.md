# Zodiac Esports Website

Zodiac Esports is a static organization website for showcasing the organization's Overwatch and VALORANT teams, rosters, staff, announcements, events, and social links.

## Stack

- HTML5
- CSS3
- Vanilla JavaScript
- SVG, PNG, and WebP assets
- GitHub Pages deployment through GitHub Actions

## Updating players

Edit `data/players.json`, then run `python scripts/build_players.py` (Python 3).
Commit the data and generated HTML together. No build step or JavaScript is
required to view profiles on GitHub Pages. Each roster card links to a permanent
`players/player-<id>.html` page; keep IDs stable when renaming players.
Team pages live in `teams/`, and each team's `page` field includes that folder
(for example, `teams/overwatch-team1.html`). Image paths in player data still use
`assets/...`; the generator handles relative paths for the nested HTML pages.

Each player has a `name`, `role`, `introduction`, `pool`, and `socials`.
The first pool entry is the signature hero or agent and supplies the roster image.
Add more entries as `{"name": "Hero or agent", "image": "assets/image.webp"}`.
Social entries use `{"label": "Twitch", "url": "https://www.twitch.tv/your-handle"}`.
Use verified accounts only. Empty introductions and social lists display friendly
placeholders. Initial pools contain only the signature picks from the original site.
The existing Placeholder roster slot remains a placeholder profile.

## Local preview

Run `python -m http.server 8000` and open `http://localhost:8000` so announcements
and events can load. Roster search matches names, roles, and signature picks;
clearing the search restores the roster. Profiles and roster links also work with
JavaScript disabled.

## Updating announcements and events

Edit `data/announcement.json` for the single pinned homepage announcement:

```json
{
  "title": "Welcome to Zodiac Esports",
  "message": "Your announcement text goes here.",
  "image": "assets/announcement-placeholder.svg"
}
```

Image paths are relative to the website root, not the `data` folder.
Missing or empty announcement fields use the default welcome content.

Edit `data/events.json` for the event list. Add an object for each event:

```json
[
  {
    "name": "Community night",
    "description": "Join us for community games.",
    "date": "2026-10-15"
  }
]
```

Use `YYYY-MM-DD` dates and `[]` for no events. Events are sorted by date;
invalid entries are ignored and past events are hidden using the visitor's local
calendar date. Failed event loads show an unavailable message.

Use double quotes, commas between entries, and no trailing commas or comments.
Both files load directly when the homepage opens: save and refresh your local
preview, or commit and deploy for the live site. No player build command is needed.
Announcement and event text is rendered as plain text, not HTML.

Run `python scripts/check_site.py` to verify local links, profile coverage, and
generated output. Run `node scripts/check_events.cjs` and
`node scripts/check_roster.cjs` for date handling and roster search checks.
