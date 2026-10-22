The pig, ox, goat, and tiger marks come from the team's design reference:
https://zodiac-website-iota.vercel.app/marks/{pig,ox,goat,tiger}.png

`points.json` contains deterministic star samples of these marks and the existing
`assets/uploads/zodiac-logo.png`. These are decorative zodiac-inspired brand shapes.
The flagship uses the Zodiac logo, as in the reference.

The monkey is sampled from `assets/uploads/zodiac-banner.png` with
`python scripts/sample_monkey_constellation.py` (Playwright and Edge required).
Its crimson stars match Monkeys, whose header uses `assets/uploads/monkey-logo.png`.

`scripts/build_constellations.py` uses these samples and the current roster to
generate static SVG artwork and accessible player profile links. Run
`python scripts/build_players.py` after roster changes; no runtime image sampling,
canvas, remote assets, or additional JavaScript dependencies are needed.

`contours.json` guides the placement of separated detail stars along the animal's
face, horns, and ears. No solid outline, fill, or glow is rendered. Regenerate these
from the local marks with `python scripts/trace_constellations.py` (requires
Playwright and Edge), then run the normal player generator. House colors in
`css/styles.css` match the existing logos: pink, blue, silver, orange, and purple.

The dragon is sampled from the upper-right dragon mark in the local Zodiac banner
with `python scripts/sample_dragon_constellation.py` (Playwright and Edge required).
Zodiac Dragons uses #4898B8 on its team page and the matching homepage star cluster.
Its SVG logo embeds the original Zodiac mark and recolors its alpha silhouette.
