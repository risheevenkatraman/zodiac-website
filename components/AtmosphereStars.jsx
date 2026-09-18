// Small, static constellations soften the transition without adding animation work.
const clusters = [
  [
    [2, 37],
    [15, 18],
    [26, 5],
    [38, 29],
    [60, 38],
    [49, 63],
    [58, 83],
    [32, 73],
    [21, 49],
  ],
  [
    [5, 14],
    [22, 30],
    [42, 35],
    [56, 52],
    [36, 64],
    [27, 85],
    [10, 69],
    [18, 48],
  ],
  [
    [4, 29],
    [20, 10],
    [46, 8],
    [67, 23],
    [51, 40],
    [69, 64],
    [41, 57],
    [25, 49],
    [16, 34],
  ],
  [
    [20, 6],
    [33, 25],
    [17, 39],
    [42, 51],
    [36, 68],
    [50, 89],
    [25, 82],
    [12, 60],
  ],
];

export default function AtmosphereStars({ edge }) {
  return (
    <div className={`atmosphere-stars atmosphere-stars-${edge}`} aria-hidden="true">
      {clusters.map((points, cluster) => (
        <svg key={cluster} viewBox="0 0 80 100" focusable="false">
          <polyline points={points.map(([x, y]) => `${x},${y}`).join(' ')} />
          {points.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={i % 3 === 0 ? 1.35 : 0.7} opacity={0.55 + (i % 4) * 0.15} />
              <circle cx={((x + 19) % 74) + 3} cy={((y + 13) % 93) + 3} r="0.35" opacity="0.4" />
            </g>
          ))}
        </svg>
      ))}
    </div>
  );
}
