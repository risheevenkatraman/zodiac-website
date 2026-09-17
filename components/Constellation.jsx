'use client';
import { useEffect, useRef } from 'react';

export default function Constellation({ house, children, variant = 'team' }) {
  const root = useRef(null);
  useEffect(() => {
    const section = root.current;
    const main = section.closest('main');
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let timer;
    let frame;
    let disposed = false;
    let started = false;
    const map = section.querySelector('.constellation-map');
    const finish = () => {
      section.classList.remove('is-forming');
      section.classList.remove('is-waiting');
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    const stars = section.querySelectorAll('.constellation-dust circle');
    const play = () => {
      finish();
      if (media.matches || disposed) return;
      started = true;
      stars.forEach((star, index) => {
        const x = Number(star.getAttribute('cx'));
        const y = Number(star.getAttribute('cy'));
        star.style.setProperty(
          '--star-delay',
          `${Math.round(Math.hypot(x - 450, y - 280) * 4 + (index % 7) * 60)}ms`,
        );
        star.style.setProperty('--star-x', `${((index % 9) - 4) * 7}px`);
        star.style.setProperty('--star-y', `${((index % 7) - 3) * 7}px`);
      });
      // Commit the reset before starting the formation.
      void section.offsetWidth;
      frame = requestAnimationFrame(() => {
        section.classList.add('is-forming');
        timer = setTimeout(finish, 4200);
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (!started && !media.matches && entries.some((entry) => entry.isIntersecting)) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    const configure = () => {
      finish();
      observer.disconnect();
      started = false;
      if (!media.matches && map) {
        section.classList.add('is-waiting');
        observer.observe(map);
      }
    };
    document.fonts.ready.then(() => {
      if (!disposed) configure();
    });
    const highlight = (event) => {
      const target = event.target.closest('[data-player]');
      const id = target?.dataset.player;
      for (const item of main.querySelectorAll('[data-player]')) {
        item.classList.toggle(
          item.classList.contains('roster-card') ? 'constellation-active' : 'is-active',
          Boolean(id) && item.dataset.player === id,
        );
      }
      if (event.type === 'focusin' && target?.classList.contains('star-label')) finish();
    };
    const clear = () => {
      for (const item of main.querySelectorAll('.is-active, .constellation-active'))
        item.classList.remove('is-active', 'constellation-active');
    };
    main.addEventListener('pointerover', highlight);
    main.addEventListener('focusin', highlight);
    main.addEventListener('pointerleave', clear);
    main.addEventListener('focusout', clear);
    media.addEventListener('change', configure);
    return () => {
      disposed = true;
      observer.disconnect();
      finish();
      clear();
      main.removeEventListener('pointerover', highlight);
      main.removeEventListener('focusin', highlight);
      main.removeEventListener('pointerleave', clear);
      main.removeEventListener('focusout', clear);
      media.removeEventListener('change', configure);
    };
  }, [house]);
  const Tag = variant === 'team' ? 'section' : 'div';
  return (
    <Tag
      ref={root}
      className={
        variant === 'hero'
          ? 'hero-art hero-constellation'
          : variant === 'tiers'
            ? 'tier-constellation'
            : 'team-constellation'
      }
      data-house={house}
      aria-labelledby={variant === 'team' ? 'constellation-heading' : undefined}
    >
      {children}
    </Tag>
  );
}
