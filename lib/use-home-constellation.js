'use client';
import { useEffect } from 'react';

// Scrolling chooses one shape; elapsed time drives the shared handoff.
const constellations = new Set();
let active = null;
let frame = 0;
let lastScrollY = 0;
let lastSample = 0;
function visibility(element) {
  const rect = element.getBoundingClientRect();
  const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
  const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
  return height * width;
}

function update(now) {
  frame = 0;
  // Cap the sample interval so a sudden jump after an idle period still catches up.
  const speed = Math.abs(scrollY - lastScrollY) / Math.max(16, Math.min(100, now - lastSample));
  const playbackRate = Math.min(3, Math.max(1, (speed * 1000) / innerHeight));
  lastScrollY = scrollY;
  lastSample = now;
  let next = null;
  let largest = 0;
  const areas = new Map();
  for (const entry of constellations) {
    const area = visibility(entry.art);
    areas.set(entry, area);
    if (area > largest || (area > 0 && area === largest && entry === active)) {
      largest = area;
      next = entry;
    }
  }
  // One shared crossover starts both animations in the same frame. A small
  // deadband prevents direction jitter from repeatedly restarting the handoff.
  if (active && areas.get(active) > 0 && largest < areas.get(active) * 1.12) next = active;
  active = next;
  // Read both artworks before changing either SVG to avoid forced layout at handoff.
  const transitions = [...constellations].map((entry) =>
    entry.prepare(entry === next, areas.get(entry) > 0, playbackRate),
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
      prepare(present, visible, playbackRate) {
        if (media.matches) present = true;
        const skipMotion = media.matches || !visible;
        if (formed === present && !skipMotion) {
          // Speed up an existing effect without resnapshotting styles or creating
          // new effects on every scroll frame. Never slow it down as scrolling ends.
          return () => {
            for (const animation of animations)
              if (animation.playState === 'running' && animation.playbackRate < playbackRate)
                animation.updatePlaybackRate(playbackRate);
          };
        }
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
              duration: present ? 1200 : 650,
              easing: 'cubic-bezier(.16,1,.3,1)',
              fill: 'both',
            });
            animations[i].playbackRate = playbackRate;
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
      lastScrollY = scrollY;
      lastSample = performance.now();
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
