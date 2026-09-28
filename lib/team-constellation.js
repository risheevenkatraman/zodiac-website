import points from '../assets/constellations/points.json';
import contours from '../assets/constellations/contours.json';

const houses = {
  Zodiac: ['zodiac', 'The flagship constellation'],
  Piggies: ['pig', 'House of the Pig'],
  Ox: ['ox', 'House of the Ox'],
  Goats: ['goat', 'House of the Goat'],
  Monkeys: ['monkey', 'House of the Monkey'],
  Tigers: ['tiger', 'House of the Tiger'],
};
const distance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

function outlineStars(contour) {
  const stars = [];
  for (const path of contour.split('M').slice(1)) {
    const vertices = [...path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((match) => [
      Number(match[1]),
      Number(match[2]),
    ]);
    let remaining = 3;
    vertices.forEach((a, index) => {
      const b = vertices[(index + 1) % vertices.length];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (remaining < length) {
        stars.push([
          Number((a[0] + ((b[0] - a[0]) * remaining) / length).toFixed(1)),
          Number((a[1] + ((b[1] - a[1]) * remaining) / length).toFixed(1)),
          Number((0.65 + (stars.length % 4) * 0.15).toFixed(2)),
          0.8,
        ]);
        remaining += 6.5;
      }
      remaining -= length;
    });
  }
  return stars;
}

// Runs in a Server Component at build time; artwork and roster geometry stay off the client.
export function teamConstellation(team) {
  const [shape, house] = houses[team.name];
  const cloud = points[shape];
  const anchors = [cloud.reduce((best, point) => (point[1] < best[1] ? point : best))];
  while (anchors.length < Math.max(35, team.players.length)) {
    let farthest = cloud[0];
    let longest = -1;
    for (const point of cloud) {
      const nearest = Math.min(...anchors.map((anchor) => distance(point, anchor)));
      if (nearest > longest) {
        longest = nearest;
        farthest = point;
      }
    }
    anchors.push(farthest);
  }
  const connected = [anchors[0]];
  const pending = anchors.slice(1);
  const edges = [];
  while (pending.length) {
    let shortest = Infinity;
    let start;
    let endIndex;
    for (const a of connected) {
      pending.forEach((b, index) => {
        const length = distance(a, b);
        if (length < shortest) {
          shortest = length;
          start = a;
          endIndex = index;
        }
      });
    }
    const [end] = pending.splice(endIndex, 1);
    if (shortest < 40 ** 2) edges.push([start, end]);
    connected.push(end);
  }
  const assigned = team.players
    .map((player, index) => ({ player, point: anchors[index] }))
    .sort((a, b) => a.point[0] - b.point[0]);
  const split = Math.ceil(assigned.length / 2);
  const labels = [assigned.slice(0, split), assigned.slice(split)].flatMap((members, side) =>
    members
      .sort((a, b) => a.point[1] - b.point[1])
      .map((member, index) => ({
        ...member,
        side: side === 0 ? 'left' : 'right',
        labelX: side === 0 ? 200 : 700,
        labelY: 560 * (members.length > 1 ? 0.16 + (0.68 * index) / (members.length - 1) : 0.5),
      })),
  );
  const dust = cloud.map(([x, y, r], i) => [
    x,
    y,
    Number((r * 1.15).toFixed(2)),
    Number((0.55 + (i % 6) / 12).toFixed(2)),
  ]);
  return { shape, house, edges, labels, dust, detail: outlineStars(contours[shape]) };
}
