'use client';
import { useEffect, useRef } from 'react';

export default function PageMotion({ pageKey, className, children }) {
  const root = useRef(null);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const animations = [];
    const pending = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            const element = entry.target;
            const atmosphere = element.parentElement.classList.contains('home-atmosphere');
            element.style.removeProperty('opacity');
            pending.delete(element);
            animations.push(
              element.animate(
                [
                  { opacity: 0, transform: `translateY(${atmosphere ? 8 : 18}px)` },
                  { opacity: 1, transform: 'translateY(0)' },
                ],
                {
                  duration: atmosphere ? 1100 : 650,
                  easing: atmosphere ? 'cubic-bezier(.22,.61,.36,1)' : 'cubic-bezier(.16,1,.3,1)',
                },
              ),
            );
            observer.unobserve(element);
          }
      },
      { threshold: 0.08 },
    );
    const reset = () => {
      observer.disconnect();
      for (const element of pending) element.style.removeProperty('opacity');
      pending.clear();
      for (const animation of animations) animation.cancel();
    };
    if (!media.matches)
      for (const element of root.current.querySelectorAll(
        'main > section:not(.team-constellation):not(.membership-tiers):not(.home-teams), .home-atmosphere > section, main > .team-grid, main > .staff-grid, .brand-strip',
      )) {
        pending.add(element);
        element.style.opacity = '0';
        observer.observe(element);
      }
    media.addEventListener('change', reset);
    return () => {
      reset();
      media.removeEventListener('change', reset);
    };
  }, [pageKey]);
  return (
    <div ref={root} className={`site-page ${className || ''}`}>
      {children}
    </div>
  );
}
