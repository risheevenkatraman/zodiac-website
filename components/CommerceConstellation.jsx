import points from '../assets/constellations/banner-stars.json';
import Constellation from './Constellation';

export default function CommerceConstellation() {
  return (
    <div className="commerce-header-art">
      <Constellation house="zodiac" variant="hero">
        <div className="constellation-map hero-star-map">
          <svg viewBox="210 40 480 480" role="img" aria-labelledby="commerce-logo-title">
            <title id="commerce-logo-title">
              Zodiac logo surrounded by Chinese zodiac animals in white and purple stars
            </title>
            <g className="constellation-dust hero-logo-stars">
              {points.map(([x, y, r], i) => (
                <circle key={i} cx={x} cy={y} r={r} opacity={0.65 + (i % 4) * 0.1} />
              ))}
            </g>
          </svg>
        </div>
      </Constellation>
    </div>
  );
}
