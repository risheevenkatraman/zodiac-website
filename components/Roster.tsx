'use client';
import type { Player } from '../lib/types';
import { useEffect, useRef } from 'react';
import { basePath, pageHref } from '../lib/paths';
import StaffAccordion from './StaffAccordion';

export default function Roster({ players }: { players: Player[] }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    const main = element?.closest('main');
    if (!element || !main) return;
    const open = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || link.target === '_blank') return;
      const person = players.find(
        (player) =>
          new URL(link.href).pathname === basePath + pageHref(`players/player-${player.id}.html`),
      );
      if (!person) return;
      const summary = [...element.querySelectorAll<HTMLElement>('summary')].find(
        (item) => item.dataset.player === person.id,
      );
      if (!summary) return;
      event.preventDefault();
      event.stopPropagation();
      for (const details of element.querySelectorAll('details'))
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
