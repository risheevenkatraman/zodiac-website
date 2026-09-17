'use client';
import { useEffect, useRef, useState } from 'react';
import Link from './SiteLink';
import { asset, basePath, pageHref } from '../lib/paths';
import InlineProfile from './InlineProfile';
import PlayerRole from './PlayerRole';

export default function Roster({ players, game, staff = false }) {
  const [selected, setSelected] = useState(null);
  const root = useRef(null);
  const lastTrigger = useRef(null);
  const profileHref = (person) =>
    basePath + pageHref(`${staff ? 'staff/staff' : 'players/player'}-${person.id}.html`);
  useEffect(() => {
    const main = root.current.closest('main');
    const open = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target.closest('a[href]');
      if (!link || link.target === '_blank') return;
      const person = players.find((person) => new URL(link.href).pathname === profileHref(person));
      if (!person) return;
      event.preventDefault();
      event.stopPropagation();
      lastTrigger.current = link;
      setSelected(person);
    };
    main.addEventListener('click', open, true);
    return () => main.removeEventListener('click', open, true);
  }, [players, staff]);
  useEffect(() => {
    if (!selected) return;
    const panel = root.current;
    panel.querySelector('h2').focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: 'instant', block: 'start' });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = panel.animate(
      [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' },
    );
    return () => animation.cancel();
  }, [selected]);
  const close = () => {
    const id = selected.id;
    setSelected(null);
    requestAnimationFrame(() => {
      const trigger = lastTrigger.current?.isConnected
        ? lastTrigger.current
        : root.current.querySelector(`[data-player="${id}"]`);
      trigger?.focus({ preventScroll: true });
      root.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  };
  return (
    <div className="inline-roster" ref={root}>
      {selected ? (
        <InlineProfile person={selected} game={game} staff={staff} onBack={close} />
      ) : (
        <>
          <div className={staff ? 'staff-grid' : 'roster-grid'}>
            {players.map((player) => (
              <Link
                className={staff ? 'staff-card' : 'roster-card'}
                data-player={player.id}
                key={player.id}
                href={pageHref(`${staff ? 'staff/staff' : 'players/player'}-${player.id}.html`)}
              >
                <img
                  className="roster-portrait"
                  src={asset(player.image || 'assets/profile-placeholder.svg')}
                  alt=""
                  width="88"
                  height="88"
                  loading="lazy"
                />
                <div>
                  <h4>{player.name}</h4>
                  {staff ? <p className="role">{player.role}</p> : <PlayerRole player={player} />}
                  <span className="profile-link">View profile →</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
