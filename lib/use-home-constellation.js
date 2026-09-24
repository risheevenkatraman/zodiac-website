'use client';
import { useEffect } from 'react';

// Scrolling chooses one shape; elapsed time drives the shared handoff.
const constellations = new Set();
let active = null;
let frame = 0;

function visibleArea(element) {
  const rect = element.getBoundingClientRect();
  return (
    Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0)) *
    Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0))
  );
}

function update() {
  frame = 0;
  let next = null;
  let largest = 0;
  for (const entry of constellations) {
    const area = visibleArea(entry.art);
    if (area > largest || (area > 0 && area === largest && entry === active)) {
      largest = area;
      next = entry;
    }
  }
  const handoff = active !== null && active !== next;
  active = next;
  for (const entry of constellations) entry.transition(entry === next, handoff);
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}

export default function useHomeConstellation(root, selector) {
  useEffect(() => {
    const element = root.current;
    const groups = [...element.querySelectorAll(selector)];
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let formed;
    let animations = [];
    const pose = (i, present) => {
      const angle = (i * Math.PI * 2) / groups.length;
      const distance = present ? 0 : 320;
      return {
        transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
        opacity: present ? '1' : '0',
      };
    };
    const entry = {
      art: element.querySelector('svg'),
      transition(present, handoff) {
        if (media.matches) present = true;
        if (formed === present) return;
        const initial = formed === undefined;
        const starts = groups.map((group, i) => {
          if (initial) return pose(i, false);
          const style = getComputedStyle(group);
          return { transform: style.transform, opacity: style.opacity };
        });
        animations.forEach((animation) => animation.cancel());
        animations = [];
        formed = present;
        groups.forEach((group, i) => {
          const end = pose(i, present);
          Object.assign(group.style, end);
          if (media.matches || (initial && !present)) return;
          animations.push(
            group.animate([starts[i], end], {
              duration: present ? 2600 : 2100,
              delay: (present && handoff ? 650 : 0) + (i % 4) * 100,
              easing: 'cubic-bezier(.4,0,.2,1)',
              fill: 'backwards',
            }),
          );
        });
      },
    };
    const changeMotion = () => {
      formed = undefined;
      schedule();
    };
    constellations.add(entry);
    if (constellations.size === 1) {
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(entry.art);
    media.addEventListener('change', changeMotion);
    schedule();
    return () => {
      animations.forEach((animation) => animation.cancel());
      observer.disconnect();
      media.removeEventListener('change', changeMotion);
      constellations.delete(entry);
      if (active === entry) active = null;
      if (!constellations.size) {
        cancelAnimationFrame(frame);
        frame = 0;
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
      } else schedule();
    };
  }, [root, selector]);
}
