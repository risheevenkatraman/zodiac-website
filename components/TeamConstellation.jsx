import { teamConstellation } from '../lib/team-constellation';
import Constellation from './Constellation';
import PageLink from './PageLink';

export default function TeamConstellation({ team }) {
  const { shape, house, edges, labels, dust, detail } = teamConstellation(team);
  const layers = Array.from({ length: 12 }, (_, index) =>
    [detail, dust].map((stars) => stars.filter((_, i) => i % 12 === index)),
  );
  return (
    <Constellation house={shape}>
      <div className="constellation-heading">
        <div>
          <p className="eyebrow">Written in the Stars</p>
          <h2 id="constellation-heading">{house}</h2>
        </div>
        <p>Every player, a star. Together, Zodiac.</p>
      </div>
      <div className="constellation-map team-layer-map">
        {layers.map((groups, index) => (
          <div className="team-star-cluster" key={index} aria-hidden="true">
            <svg viewBox="0 0 900 560" preserveAspectRatio="none" focusable="false">
              {groups.map((stars, group) => (
                <g
                  key={group}
                  className={`constellation-dust${group === 0 ? ' constellation-detail-stars' : ''}`}
                >
                  {stars.map(([x, y, r, opacity], i) => (
                    <circle key={i} cx={x} cy={y} r={r} opacity={opacity} />
                  ))}
                </g>
              ))}
            </svg>
          </div>
        ))}
        <svg viewBox="0 0 900 560" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <g className="constellation-lines">
            {edges.map(([a, b], i) => (
              <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
            ))}
          </g>
          {labels.map(({ player, point: [x, y], labelX, labelY }) => (
            <g className="player-star" data-player={player.id} key={player.id}>
              <path className="star-leader" d={`M${x},${y} L${labelX},${labelY}`} />
              <circle className="star-ring" cx={x} cy={y} r="8" />
              <circle className="star-core" cx={x} cy={y} r="4" />
            </g>
          ))}
        </svg>
        {labels.map(({ player, side, labelY }) => (
          <PageLink
            key={player.id}
            className={`star-label star-label-${side}`}
            data-player={player.id}
            style={{ top: `${((labelY / 560) * 100).toFixed(2)}%` }}
            href={`players/player-${player.id}.html`}
          >
            <span>{player.name}</span>
            <small>{player.role}</small>
          </PageLink>
        ))}
        {!labels.length && (
          <p className="constellation-empty">
            Your next stars are on the horizon.
            <br />
            Roster reveal coming soon.
          </p>
        )}
      </div>
      <p className="constellation-caption">
        {team.game} / {team.name}
        <span>
          {labels.length ? 'Choose a named star to meet the player' : 'Destined for Victory'}
        </span>
      </p>
    </Constellation>
  );
}
