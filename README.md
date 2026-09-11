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

## Updating staff

Edit `data/staff.json`, then run `python scripts/build_staff.py` (Python 3).
Commit the JSON and generated HTML together, just like player updates.
Each staff card links to `staff/staff-<id>.html`; keep IDs stable when renaming staff.

Each entry has `id`, `name`, `role`, `image`, `introduction`, and `socials`.
Image paths use `assets/...`. Social entries use
`{"label": "Twitch", "url": "https://www.twitch.tv/your-handle"}`.
Use verified accounts only. Empty introductions and social lists show placeholders.
Both the directory and profiles work without JavaScript.

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

## Automatic FACEIT matches

The deployment workflow runs on pushes to `main`, manually from the Actions tab,
and daily at 10:17 UTC (GitHub may delay scheduled runs). It reads the server-side
key from the repository Actions secret `FACEIT_API_KEY`, runs
`scripts/sync_matches.py`, and publishes the merged events directly to GitHub Pages
using `actions/upload-pages-artifact` and `actions/deploy-pages`.
In repository **Settings → Pages → Build and deployment**, set **Source** to
**GitHub Actions**. The workflow no longer publishes by committing to `gh-pages`.
The imported events are generated in the deployment checkout; they are not
committed back to `main`. Keep editing manual events in `data/events.json`.

`data/match_sources.json` currently configures Zodiac's flagship Overwatch team, Goats, Ox, and Piggies
for Season 10. Add other teams once their FACEIT team IDs and seasons are known.
The importer discovers the game's ID from the team, searches championships for
the season, and filters matches by the exact FACEIT team ID. Descriptions are
`Zodiac vs Opponent`. Dates use the configured `timezone` (currently
`America/New_York`); change this if the organization uses another calendar zone.

FACEIT's team `/leagues` webpage is not scraped. Zodiac's supplied match metadata
identifies championship `35b0ad84-0125-424b-811c-29eaa02e7096`, named
`S10 NA Master Central - Regular Season`; this ID is configured directly.
All four teams have a `reference_match_id` from their Season 10 schedules.
Goats, Ox, and Piggies derive their championship IDs from those matches,
bypassing competition-name search. The importer validates each reference's
game, season, and team ID before loading that championship's match list.
Team IDs determine membership even when FACEIT uses a different team name.
An Actions run must still verify the full fixture lists for all four teams.
If discovery fails, the workflow reports an error and leaves the live site
unchanged. An optional `championship_ids` array can identify verified competitions
directly; those must still match the configured game and season. If FACEIT does
not expose this league through that API, another supported source is needed.

Every run rebuilds imported matches, so changed dates replace old dates and
cancelled, finished, or undated matches are omitted. Manual events are preserved.
Any API or parsing failure stops deployment before publishing partial results.
Do not add `source: "faceit"` to manual events: that marks imported records.

After these changes are pushed to `main`, open **Actions → Deploy to GitHub Pages
→ Run workflow** to perform the first live check. Review the **Update FACEIT
match schedules** step for the match count or an actionable error. Saving the
secret alone does not activate the workflow.

Offline importer checks: `python -m unittest discover -s scripts -p "test_sync_matches.py"`.

To diagnose fixture discovery, run **Actions → Inspect FACEIT match → Run workflow**.
The default match ID is the Zodiac Season 10 example supplied from its schedule.
The **Inspect match metadata** step logs only match/competition metadata and team
names/IDs, using the existing repository secret. It does not deploy or edit events.
Use this output to identify the actual competition type before changing discovery.

For a local sync, supply `FACEIT_API_KEY` through your environment; it is never
included in the website JavaScript. Windows Python may require `tzdata` installed
to use IANA time zones; the Linux Actions runner supplies them.

Run `python scripts/check_site.py` to verify local links, profile coverage, and
generated output. Run `node scripts/check_events.cjs` and
`node scripts/check_roster.cjs` for date handling and roster search checks.
