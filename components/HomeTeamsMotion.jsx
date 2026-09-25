'use client';
import { useEffect, useRef } from 'react';
import useHomeConstellation from '../lib/use-home-constellation';
export default function HomeTeamsMotion({ children }) {
  const root = useRef(null);
  // HTML layers use percentages to preserve the SVG's 320-unit scatter
  // distance at every rendered size of the 480-unit viewBox.
  useHomeConstellation(root, '.home-team-cluster', { distance: (320 / 480) * 100, unit: '%' });
  useEffect(() => {
    const element = root.current;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let activeTeam = null;
    let motion = [];
    let generation = 0;
    const stopDrift = () => {
      generation++;
      motion.forEach((animation) => animation.cancel());
      motion = [];
      activeTeam = null;
    };
    const drift = () => {
      const target =
        element.querySelector('[data-team]:focus-visible') ||
        element.querySelector('[data-team]:hover');
      const team = target?.dataset.team;
      if (media.matches || !team) {
        stopDrift();
        return;
      }
      if (team === activeTeam) return;
      stopDrift();
      activeTeam = team;
      const token = generation;
      const flagship = team.endsWith('team1');
      const nodes = [
        ...element.querySelectorAll(
          flagship
            ? '[data-star-team="flagship"], .home-team-chart > [data-team="overwatch-team1"], .home-team-chart > [data-team="valorant-team1"]'
            : `[data-star-team="${team}"]`,
        ),
      ];
      const randomPoint = () =>
        `${((Math.random() - 0.5) * 2.4).toFixed(2)}px ${((Math.random() - 0.5) * 2.4).toFixed(2)}px`;
      const run = (starts) => {
        if (token !== generation) return;
        const shared = randomPoint();
        const ends = nodes.map(() => (flagship ? shared : randomPoint()));
        const duration = 1800 + Math.random() * 1400;
        const previous = motion;
        motion = nodes.map((node, i) =>
          node.animate([{ translate: starts[i] }, { translate: ends[i] }], {
            duration,
            easing: 'ease-in-out',
            fill: 'forwards',
          }),
        );
        previous.forEach((animation) => animation.cancel());
        if (motion[0]) motion[0].onfinish = () => run(ends);
      };
      run(nodes.map(() => '0px 0px'));
    };
    const changeMotion = () => {
      drift();
    };
    media.addEventListener('change', changeMotion);
    element.addEventListener('pointerover', drift);
    element.addEventListener('pointerout', drift);
    element.addEventListener('focusin', drift);
    element.addEventListener('focusout', drift);
    element.addEventListener('pointerleave', stopDrift);
    return () => {
      stopDrift();
      media.removeEventListener('change', changeMotion);
      element.removeEventListener('pointerover', drift);
      element.removeEventListener('pointerout', drift);
      element.removeEventListener('focusin', drift);
      element.removeEventListener('focusout', drift);
      element.removeEventListener('pointerleave', stopDrift);
    };
  }, []);
  return (
    <div className="home-team-universe" ref={root}>
      {children}
    </div>
  );
}
