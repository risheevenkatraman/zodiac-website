import points from '../assets/constellations/points.json';
import contours from '../assets/constellations/contours.json';
import HomeStarMotion from './HomeStarMotion';

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
  const clusters = Array.from({ length: 16 }, () => ['', '', '']);
  const stars = [...points.zodiac, ...detailStars()]
    .map(([x, y, r]) => [x, y, r * 1.15])
    .concat(orbit);
  stars.forEach(([x, y, r], i) => {
    clusters[i % 16][i % 3] +=
      `M${(x - r).toFixed(2)},${y.toFixed(2)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
  });
  return (
    <HomeStarMotion>
      <div className="constellation-map hero-star-map">
        <svg viewBox="210 40 480 480" role="img" aria-labelledby="hero-logo-title">
          <title id="hero-logo-title">
            Zodiac logo and orbit formed from white and purple stars
          </title>
          {clusters.map((paths, i) => (
            <g className="home-star-cluster" key={i}>
              <g>
                {paths.map((d, color) => (
                  <path
                    key={color}
                    d={d}
                    fill={['#b78adf', '#f8f5ff', '#d9c7f1'][color]}
                    opacity="0.85"
                  />
                ))}
              </g>
            </g>
          ))}
        </svg>
      </div>
      <span className="hero-star-caption">The future is ours to write</span>
    </HomeStarMotion>
  );
}
