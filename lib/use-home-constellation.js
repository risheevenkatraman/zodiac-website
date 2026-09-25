'use client';
import { useEffect } from 'react';

// Scrolling chooses one shape; elapsed time drives the shared handoff.
const constellations = new Set();
let active = null;
let frame = 0;
function visibility(element) {
  const rect = element.getBoundingClientRect();
  const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
  const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
  return {
    area: height * width,
    // Release the outgoing shape while its stars are still on screen, even
    // when the next section is too far away to compete for visible area.
    canForm: height >= Math.min(rect.height, innerHeight) * 0.65,
  };
}

function update() {
  frame = 0;
  let next = null;
  let largest = 0;
  const areas = new Map();
  for (const entry of constellations) {
    const { area, canForm } = visibility(entry.art);
    areas.set(entry, area);
    if (canForm && (area > largest || (area > 0 && area === largest && entry === active))) {
      largest = area;
      next = entry;
    }
  }
  active = next;
  // Read both artworks before changing either SVG to avoid forced layout at handoff.
  const transitions = [...constellations].map((entry) =>
    entry.prepare(entry === next, areas.get(entry) > 0),
  );
  transitions.forEach((transition) => transition?.());
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}

export default function useHomeConstellation(root, selector, { distance = 320, unit = 'px' } = {}) {
  useEffect(() => {
    const element = root.current;
    const groups = [...element.querySelectorAll(selector)];
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let formed;
    let animations = [];
    const pose = (i, present) => {
      const angle = (i * Math.PI * 2) / groups.length;
      const offset = present ? 0 : distance;
      return {
        transform: `translate(${Math.cos(angle) * offset}${unit}, ${Math.sin(angle) * offset}${unit})`,
        opacity: present ? '1' : '0',
      };
    };
    const entry = {
      art: element.querySelector('svg'),
      prepare(present, visible) {
        if (media.matches) present = true;
        const skipMotion = media.matches || !visible;
        if (formed === present && !skipMotion) return;
        if (formed === present && animations.every((animation) => animation.playState === 'idle'))
          return;
        // Snapshot before either artwork changes so interrupted handoffs continue
        // from the stars' current positions without interleaving layout reads/writes.
        const starts = skipMotion
          ? []
          : groups.map((group, i) => {
              if (!animations[i] || animations[i].playState === 'idle')
                return pose(i, Boolean(formed));
              const style = getComputedStyle(group);
              return { transform: style.transform, opacity: style.opacity };
            });
        return () => {
          formed = present;
          groups.forEach((group, i) => {
            const end = pose(i, present);
            Object.assign(group.style, end);
            animations[i]?.cancel();
            if (skipMotion) return;
            // Dissolve immediately: reversing the long ease-out formation
            // creates an ease-in that holds the shape until it is off screen.
            animations[i] = group.animate([starts[i], end], {
              duration: present ? 2600 : 900,
              delay: present ? (i % 4) * 35 : 0,
              easing: 'cubic-bezier(.16,1,.3,1)',
              fill: 'both',
            });
          });
        };
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
  }, [root, selector, distance, unit]);
}
