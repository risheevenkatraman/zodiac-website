import { insideLogo } from '../lib/constellation-shape';
import points from '../assets/constellations/banner-stars-dense.json';
import { basePath } from '../lib/paths';
import HomeTeamsMotion from './HomeTeamsMotion';

const teams = [
  {
    name: 'Zodiac Overwatch',
    route: 'overwatch-team1',
    color: '#b78adf',
    x: 538,
    y: 193,
    rx: 18,
    ry: 18,
  },
  {
    name: 'Zodiac VALORANT',
    route: 'valorant-team1',
    color: '#d9c7f1',
    x: 373,
    y: 355,
    rx: 18,
    ry: 18,
  },
  { name: 'Piggies', route: 'overwatch-team2', color: '#f83088', x: 617, y: 363, rx: 37, ry: 37 },
  { name: 'Ox', route: 'overwatch-team3', color: '#0068ff', x: 360, y: 132, rx: 38, ry: 41 },
  { name: 'Goats', route: 'overwatch-team4', color: '#aebfd9', x: 289, y: 371, rx: 36, ry: 43 },
  {
    name: 'Monkeys',
    route: 'overwatch-team5',
    color: '#dc143c',
    x: 557,
    y: 432,
    rx: 36,
    ry: 39,
  },
  { name: 'Tigers', route: 'valorant-team2', color: '#ff7000', x: 446, y: 100, rx: 39, ry: 35 },
];
const clusters = Array.from({ length: 16 }, () => ({}));
const anchorCells = new Set();
// Stable variation keeps the server/client artwork identical, without a repeating grid pattern.
function starNoise(x, y, seed) {
  let value = (Math.round(x * 100) * 374761393 + Math.round(y * 100) * 668265263 + seed) | 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}
// The dense source is useful for fine animal strokes. Keep the central mark
// airy by retaining more edge stars than interior stars.
const sampleCell = (x, y) => [
  Math.floor((x - 230) / 1.76 + 0.01),
  Math.floor((y - 60) / 1.76 + 0.01),
];
const occupied = new Set(points.map(([x, y]) => sampleCell(x, y).join(',')));
points.forEach(([x, y, r], i) => {
  const animal = teams
    .slice(2)
    .find((t) => ((x - t.x) / t.rx) ** 2 + ((y - t.y) / t.ry) ** 2 < 1.25);
  const goat = animal?.name === 'Goats';
  const central = !animal && insideLogo(x, y);
  if (central) {
    const [cx, cy] = sampleCell(x, y);
    const edge = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => !occupied.has(`${cx + dx},${cy + dy}`));
    if (starNoise(x, y, 491) > (edge ? 0.72 : 0.22)) return;
  }
  const color = goat
    ? 'url(#home-goat-silver)'
    : animal?.color ||
      (central ? 'url(#home-logo-purple)' : ['#b78adf', '#f8f5ff', '#d9c7f1'][i % 3]);
  const size = starNoise(x, y, 17);
  const cell = `${Math.floor(x / 12)},${Math.floor(y / 12)}`;
  const anchor = size > 0.985 && !anchorCells.has(cell);
  if (anchor) anchorCells.add(cell);
  // Fine tracing stars retain the silhouettes; a few larger stars add depth.
  r = anchor ? 1.15 + starNoise(x, y, 83) * 0.35 : 0.35 + size * 0.4;
  if (goat) r *= 1.15;
  const opacity = anchor ? 1 : size < 0.3 ? 0.4 : size < 0.7 ? 0.65 : 0.85;
  const key = `${color}|${opacity}|${animal?.route || (central ? 'flagship' : 'unassigned')}`;
  // Scatter each animation group across the artwork so individual stars
  // regroup into the teams instead of arriving as preformed pieces.
  const layer = clusters[i % clusters.length];
  layer[key] =
    (layer[key] || '') +
    `M${(x - r).toFixed(2)},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
  if (anchor && size > 0.997) {
    const ray = r * 2.2;
    layer[key] +=
      `M${x},${y - ray}l0.4,${ray - 0.4} ${ray - 0.4},0.4 ${-ray + 0.4},0.4 -0.4,${ray - 0.4} -0.4,${-ray + 0.4} ${-ray + 0.4},-0.4 ${ray - 0.4},-0.4Z`;
  }
});
export default function HomeTeams() {
  return (
    <HomeTeamsMotion>
      <svg
        className="home-team-chart"
        viewBox="210 40 480 480"
        aria-labelledby="home-team-chart-title"
      >
        <title id="home-team-chart-title">Choose a Zodiac team from the stars</title>
        <defs>
          <linearGradient
            id="home-logo-purple"
            gradientUnits="userSpaceOnUse"
            x1="330"
            y1="365"
            x2="590"
            y2="180"
          >
            <stop stopColor="#783ddb" />
            <stop offset="0.5" stopColor="#ad69eb" />
            <stop offset="1" stopColor="#d2a0ff" />
          </linearGradient>
          <linearGradient
            id="home-goat-silver"
            gradientUnits="userSpaceOnUse"
            x1="265"
            y1="335"
            x2="315"
            y2="410"
          >
            <stop stopColor="#8195b5" />
            <stop offset="0.45" stopColor="#e1e8f4" />
            <stop offset="1" stopColor="#8d9eb9" />
          </linearGradient>
        </defs>
        {clusters.map((paths, i) => (
          <g className="home-team-cluster" key={i}>
            {Object.entries(paths).map(([key, d]) => {
              const [color, opacity, team] = key.split('|');
              const origin = teams.find((item) => item.route === team);
              return (
                <path
                  key={key}
                  className="interactive-team-stars"
                  data-star-team={team}
                  d={d}
                  fill={color}
                  opacity={opacity}
                  style={{
                    transformOrigin: `${origin?.x || 450}px ${origin?.y || 280}px`,
                    '--drift-x': `${((i % 5) - 2) * 0.55}px`,
                    '--drift-y': `${((i % 7) - 3) * 0.4}px`,
                    '--drift-duration': `${2.6 + (i % 5) * 0.35}s`,
                  }}
                />
              );
            })}
          </g>
        ))}
        {teams.map((t) => (
          <a
            key={t.route}
            data-team={t.route}
            href={`${basePath}/teams/${t.route}/`}
            aria-label={`Meet ${t.name}`}
            className="home-team-target"
            style={{ '--team-color': t.color }}
          >
            <title>{t.name}</title>
            <ellipse cx={t.x} cy={t.y} rx={t.rx} ry={t.ry} />
            {t.route.endsWith('team1') && (
              <g
                className="flagship-sigil flagship-beacon"
                transform={`translate(${t.x} ${t.y})`}
                aria-hidden="true"
              >
                <circle className="beacon-ring" r="13" />
                <g className="sigil-satellites">
                  <circle cx="13" cy="0" r="1.2" />
                  <circle cx="-6.5" cy="11.3" r="0.8" />
                  <circle cx="-6.5" cy="-11.3" r="1" />
                </g>
                <path
                  className="beacon-leader"
                  d={t.route.startsWith('overwatch') ? 'M-9-9-18-18H-70' : 'M9 9 18 22H75'}
                />
                <text
                  className="beacon-label"
                  x={t.route.startsWith('overwatch') ? -20 : 20}
                  y={t.route.startsWith('overwatch') ? -23 : 34}
                  textAnchor={t.route.startsWith('overwatch') ? 'end' : 'start'}
                >
                  {t.route.startsWith('overwatch') ? 'Overwatch' : 'VALORANT'}
                </text>
              </g>
            )}
          </a>
        ))}
      </svg>
      <p className="atlas-label">One constellation. Every team has its place.</p>
      <nav className="home-team-legend" aria-label="Choose a team">
        {teams.map((t) => (
          <a
            key={t.route}
            data-team={t.route}
            href={`${basePath}/teams/${t.route}/`}
            style={{ '--team-color': t.color }}
          >
            <span aria-hidden="true" />
            {t.name}
          </a>
        ))}
      </nav>
    </HomeTeamsMotion>
  );
}
