# Zodiac Esports Website

Zodiac Esports is a static organization website for showcasing the organization's Overwatch and VALORANT teams, rosters, staff, announcements, events, and social links.

## Stack

- **Frontend:** HTML5, CSS3, and vanilla JavaScript for roster search, announcements,
  and the current-month events calendar.
- **Content:** JSON files in `data/` for players, staff, announcements, manual events,
  and FACEIT match sources; SVG, PNG, JPEG, and WebP assets.
- **Generation and automation:** Python 3 (3.12 in CI) with standard-library scripts
  to generate player/staff pages and sync match schedules.
- **Match data:** FACEIT Data API, authenticated with the `FACEIT_API_KEY` GitHub
  Actions secret. Reference matches identify each team's championship; imported
  events include opponents, dates, and competition/division names.
- **Hosting and deployment:** GitHub Pages, published directly from GitHub Actions
  with `configure-pages`, `upload-pages-artifact`, and `deploy-pages`. Deployments
  run on pushes to `main`, manual runs, and a daily 10:17 UTC schedule.
- **Validation:** Python `unittest` for the importer, Python site/link checks, and
  Node.js scripts for event parsing and roster search.

The deployed site is static: it has no application server or database. Python
runs during content generation and automation; browsers load the resulting HTML,
assets, and JSON. Local Windows Python may need `tzdata` for match time zones.
