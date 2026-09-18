import { insideLogo } from '../lib/constellation-shape';
import points from '../assets/constellations/banner-stars.json';
import Constellation from './Constellation';

// Combine the original stars into a few paths: preserve the artwork without
// thousands of independent DOM nodes and concurrent CSS animations.
const layers = Array.from({ length: 12 }, () => ['', '', '']);
const cellAt = (x, y) => [Math.floor((x - 230) / 2.64 + 0.01), Math.floor((y - 60) / 2.64 + 0.01)];
const occupied = new Set(points.map(([x, y]) => cellAt(x, y).join(',')));
points.forEach(([x, y, r], i) => {
  if (insideLogo(x, y)) {
    const [cx, cy] = cellAt(x, y);
    const edge = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => !occupied.has(`${cx + dx},${cy + dy}`));
    // Keep the fine outline and orbit; thin the dense interior deterministically.
    let hash = Math.imul(i + 1, 374761393);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    const sample = ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
    if (sample > (edge ? 0.85 : 0.28)) return;
  }
  // Mix stars from across the mark so each arriving cluster looks like scattered
  // starlight rather than a solid ring or animal moving as a single piece.
  const layer = (i * 7 + Math.floor(i / 12)) % 12;
  const color = i % 3;
  layers[layer][color] +=
    `M${(x - r).toFixed(2)},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
});

export default function CommerceConstellation() {
  return (
    <div className="commerce-header-art">
      <Constellation house="zodiac" variant="hero">
        <div className="constellation-map hero-star-map">
          <svg viewBox="210 40 480 480" role="img" aria-labelledby="commerce-logo-title">
            <title id="commerce-logo-title">
              Zodiac logo surrounded by Chinese zodiac animals in white and purple stars
            </title>
            {layers.map((paths, index) => (
              <g
                key={index}
                className="commerce-star-layer"
                style={{
                  '--layer-delay': `${(index % 4) * 110}ms`,
                  '--arrival-x': `${(Math.cos((index * Math.PI) / 6) * (150 + (index % 3) * 35)).toFixed(2)}px`,
                  '--arrival-y': `${(Math.sin((index * Math.PI) / 6) * (150 + (index % 3) * 35)).toFixed(2)}px`,
                }}
              >
                {paths.map((d, color) => (
                  <path
                    key={color}
                    d={d}
                    fill={['#b78adf', '#f8f5ff', '#d9c7f1'][color]}
                    opacity="0.85"
                  />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </Constellation>
    </div>
  );
}
