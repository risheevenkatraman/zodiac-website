import points from '../assets/constellations/points.json';
import contours from '../assets/constellations/contours.json';
import Constellation from './Constellation';

function detailStars() {
  const stars = [];
  for (const path of contours.zodiac.split('M').slice(1)) {
    const vertices = [...path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((match) => [
      Number(match[1]),
      Number(match[2]),
    ]);
    let remaining = 3;
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i],
        b = vertices[(i + 1) % vertices.length];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (remaining < length) {
        stars.push([
          a[0] + ((b[0] - a[0]) * remaining) / length,
          a[1] + ((b[1] - a[1]) * remaining) / length,
          0.8,
        ]);
        remaining += 6.5;
      }
      remaining -= length;
    }
  }
  return stars;
}

export default function HeroLogo() {
  const orbit = Array.from({ length: 160 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 160;
    const x = 211 * Math.cos(angle),
      y = 106 * Math.sin(angle),
      tilt = -Math.PI / 5;
    return [
      450 + x * Math.cos(tilt) - y * Math.sin(tilt),
      280 + x * Math.sin(tilt) + y * Math.cos(tilt),
      i % 8 === 0 ? 1.6 : 0.75,
    ];
  });
  return (
    <Constellation house="zodiac" variant="hero">
      <div className="constellation-map hero-star-map">
        <svg viewBox="210 40 480 480" role="img" aria-labelledby="hero-logo-title">
          <title id="hero-logo-title">
            Zodiac logo and orbit formed from white and purple stars
          </title>
          <g className="constellation-dust hero-logo-stars">
            {[...points.zodiac, ...detailStars()].map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r * 1.15} opacity={0.65 + (i % 4) * 0.1} />
            ))}
          </g>
          <g className="constellation-dust hero-orbit-stars">
            {orbit.map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} opacity={0.45 + (i % 5) * 0.1} />
            ))}
          </g>
        </svg>
      </div>
      <span className="hero-star-caption">The future is ours to write</span>
    </Constellation>
  );
}
