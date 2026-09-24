"""Static, accessible team star maps generated from the current roster data."""
import json
import math
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOUSES = {
    'Zodiac': ('zodiac', 'The flagship constellation'),
    'Piggies': ('pig', 'House of the Pig'),
    'Ox': ('ox', 'House of the Ox'),
    'Goats': ('goat', 'House of the Goat'),
    'Monkeys': ('monkey', 'House of the Monkey'),
    'Tigers': ('tiger', 'House of the Tiger'),
}


def outline_stars(contour):
    """Place separated stars along the defining features, without drawing an outline."""
    stars = []
    for path in contour.split('M')[1:]:
        vertices = [tuple(map(float, pair.split(',')))
                    for pair in re.findall(r'-?[\d.]+,-?[\d.]+', path)]
        if not vertices:
            continue
        remaining = 3.0
        for a, b in zip(vertices, vertices[1:] + vertices[:1]):
            length = math.dist(a, b)
            while remaining < length:
                fraction = remaining / length
                x, y = a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction
                radius = 0.65 + (len(stars) % 4) * 0.15
                stars.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{radius:.2f}" opacity="0.8"/>')
                remaining += 6.5
            remaining -= length
    return ''.join(stars)


def constellation(team):
    shape, house = HOUSES[team['name']]
    points = json.loads((ROOT / 'assets/constellations/points.json').read_text())[shape]
    contour = json.loads((ROOT / 'assets/constellations/contours.json').read_text())[shape]
    # Spread the brighter stars across the silhouette instead of clustering them.
    anchors = [min(points, key=lambda p: p[1])]
    for _ in range(max(35, len(team['players'])) - 1):
        anchors.append(max(points, key=lambda p: min(
            (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 for q in anchors
        )))
    dust = ''.join(f'<circle cx="{x}" cy="{y}" r="{r * 1.15:.2f}" opacity="{0.55 + (i % 6) / 12:.2f}"/>'
                   for i, (x, y, r) in enumerate(points))
    # A minimum spanning tree supplies the fine constellation connecting lines.
    connected, pending, edges = [anchors[0]], anchors[1:], []
    while pending:
        a, b = min(((a, b) for a in connected for b in pending),
                   key=lambda pair: (pair[0][0] - pair[1][0]) ** 2 + (pair[0][1] - pair[1][1]) ** 2)
        # Long chords cut across the animal's negative space and obscure its shape.
        if (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 < 40 ** 2:
            edges.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}"/>')
        connected.append(b)
        pending.remove(b)
    stars, labels = [], []
    assignments = list(zip(team['players'], anchors))
    assignments.sort(key=lambda item: item[1][0])
    split = (len(assignments) + 1) // 2
    for side, members in [('left', assignments[:split]), ('right', assignments[split:])]:
        members.sort(key=lambda item: item[1][1])
        for index, (player, (x, y, _)) in enumerate(members):
            label_y = 560 * (0.16 + 0.68 * index / (len(members) - 1) if len(members) > 1 else 0.5)
            label_x = 200 if side == 'left' else 700
            slug = escape(player['id'], quote=True)
            name, role = escape(player['name']), escape(player['role'])
            stars.append(f'''<g class="player-star" data-player="{slug}">
              <path class="star-leader" d="M{x},{y} L{label_x},{label_y}"/>
              <circle class="star-ring" cx="{x}" cy="{y}" r="8"/>
              <circle class="star-core" cx="{x}" cy="{y}" r="4"/>
            </g>''')
            labels.append(f'''<a class="star-label star-label-{side}" data-player="{slug}"
              style="top:{label_y / 560 * 100:.2f}%" href="../players/player-{slug}.html">
              <span>{name}</span><small>{role}</small></a>''')
    if not assignments:
        labels.append('<p class="constellation-empty">Your next stars are on the horizon.<br>Roster reveal coming soon.</p>')
    markup = f'''<!-- constellation:start -->
    <section class="team-constellation" data-house="{shape}" aria-labelledby="constellation-heading">
      <div class="constellation-heading"><div><p class="eyebrow">Written in the Stars</p>
      <h2 id="constellation-heading">{house}</h2></div><p>Every player, a star. Together, Zodiac.</p></div>
      <div class="constellation-map">
        <svg viewBox="0 0 900 560" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <g class="constellation-dust constellation-detail-stars">{outline_stars(contour)}</g>
          <g class="constellation-dust">{dust}</g>
          <g class="constellation-lines">{''.join(edges)}</g>
          {''.join(stars)}
        </svg>
        {''.join(labels)}
      </div>
      <p class="constellation-caption">{escape(team['game'])} / {escape(team['name'])}<span>{'Choose a named star to meet the player' if assignments else 'Destined for Victory'}</span></p>
    </section>
    <!-- constellation:end -->'''
    return '\n'.join(line.rstrip() for line in markup.splitlines())
