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
  const areas = new Map();
  for (const entry of constellations) {
    const area = visibleArea(entry.art);
    areas.set(entry, area);
    if (area > largest || (area > 0 && area === largest && entry === active)) {
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
        return () => {
          const previous = formed;
          formed = present;
          groups.forEach((group, i) => {
            Object.assign(group.style, pose(i, present));
            let animation = animations[i];
            if (skipMotion) {
              animation?.cancel();
              return;
            }
            // Reuse each effect instead of reading computed transforms and
            // recreating layers whenever scroll direction changes.
            if (!animation) {
              animation = new Animation(
                new KeyframeEffect(group, [pose(i, false), pose(i, true)], {
                  duration: 2600,
                  delay: (i % 4) * 35,
                  easing: 'cubic-bezier(.16,1,.3,1)',
                  fill: 'both',
                }),
                document.timeline,
              );
              animations[i] = animation;
            }
            if (animation.currentTime === null) {
              animation.currentTime = previous ? 2600 + (i % 4) * 35 : 0;
            }
            animation.updatePlaybackRate(present ? 1 : -1);
            animation.play();
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
