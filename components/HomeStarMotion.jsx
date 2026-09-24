'use client';
import { useRef } from 'react';
import useHomeConstellation from '../lib/use-home-constellation';

export default function HomeStarMotion({ children }) {
  const root = useRef(null);
  useHomeConstellation(root, '.home-star-cluster');
  return (
    <div ref={root} className="hero-art hero-constellation home-star-art">
      {children}
    </div>
  );
}
