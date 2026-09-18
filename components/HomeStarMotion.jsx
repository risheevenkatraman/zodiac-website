'use client';
import { useEffect, useRef } from 'react';

export default function HomeStarMotion({ children }) {
  const root = useRef(null);
  useEffect(() => {
    const element = root.current;
    const hero = element.closest('.home-hero');
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const groups = [...element.querySelectorAll('.home-star-cluster')];
    let animations = [];
    let frame = 0;
    let disposed = false;
    const render = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const progress = media.matches
        ? 0
        : Math.max(0, Math.min(1, (-rect.top + 80) / (rect.height * 0.75)));
      groups.forEach((group, i) => {
        const angle = (i * Math.PI * 2) / groups.length;
        const distance = progress * progress * 320;
        group.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
        group.style.opacity = String(1 - progress);
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const configure = () => {
      animations.forEach((animation) => animation.cancel());
      animations = [];
      render();
      if (media.matches) return;
      groups.forEach((group, i) => {
        const angle = (i * Math.PI * 2) / groups.length;
        animations.push(
          group.firstElementChild.animate(
            [
              {
                opacity: 0,
                transform: `translate(${Math.cos(angle) * 380}px, ${Math.sin(angle) * 380}px)`,
              },
              { opacity: 1, transform: 'translate(0, 0)' },
            ],
            {
              duration: 1900,
              delay: (i % 4) * 100,
              easing: 'cubic-bezier(.16,1,.3,1)',
              fill: 'backwards',
            },
          ),
        );
      });
    };
    document.fonts.ready.then(() => {
      if (!disposed) configure();
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    media.addEventListener('change', configure);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      animations.forEach((animation) => animation.cancel());
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      media.removeEventListener('change', configure);
    };
  }, []);
  return (
    <div ref={root} className="hero-art hero-constellation home-star-art">
      {children}
    </div>
  );
}
