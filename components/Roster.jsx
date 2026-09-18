'use client';
import { useEffect, useRef } from 'react';
import { basePath, pageHref } from '../lib/paths';
import StaffAccordion from './StaffAccordion';

export default function Roster({ players }) {
  const root = useRef(null);
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
      const person = players.find(
        (player) =>
          new URL(link.href).pathname === basePath + pageHref(`players/player-${player.id}.html`),
      );
      if (!person) return;
      const summary = [...root.current.querySelectorAll('summary')].find(
        (item) => item.dataset.player === person.id,
      );
      if (!summary) return;
      event.preventDefault();
      event.stopPropagation();
      for (const details of root.current.querySelectorAll('details'))
        details.open = details === summary.parentElement;
      summary.focus({ preventScroll: true });
      summary.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
    };
    main.addEventListener('click', open, true);
    return () => main.removeEventListener('click', open, true);
  }, [players]);
  return (
    <div className="player-accordion" ref={root}>
      <StaffAccordion members={players} players />
    </div>
  );
}
