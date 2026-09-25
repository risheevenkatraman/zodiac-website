'use client';

import { useRef, useState } from 'react';
import useHomeConstellation from '../lib/use-home-constellation';

export default function PartnershipOrbit({ partners, constellation }) {
  const [selected, setSelected] = useState(null);
  const core = useRef(null);
  useHomeConstellation(core, '.home-star-cluster');
  const partner = partners.find((item) => item.id === selected);
  // Six generous slots are the baseline; denser lineups share the same circumference.
  const logoSize = 17 * Math.min(1, 6 / Math.max(partners.length, 1));
  const orbitRadius = 40 + (17 - logoSize) * 0.1;

  return (
    <section className="partnership-universe" aria-label="Explore our partners">
      <div
        className="partnership-sky"
        style={{
          '--partner-size': `${logoSize}%`,
          '--partner-radius': `${orbitRadius}%`,
        }}
      >
        <div className="partnership-core" ref={core}>
          {constellation}
        </div>
        <div className="partnership-orbit-track" aria-hidden="true" />
        <div className="partnership-satellites" role="group" aria-label="Partner selection">
          {partners.map((item, index) => (
            <div
              className="partnership-orbit-position"
              key={item.id}
              style={{ '--partner-offset': `${(index * 100) / partners.length}%` }}
            >
              <div className="partnership-orbit-spin">
                <div className="partnership-satellite">
                  <div className="partnership-counter-spin">
                    <button
                      type="button"
                      className={`partnership-choice ${item.logoClass}`}
                      aria-label={`Show ${item.name}`}
                      aria-pressed={selected === item.id}
                      aria-controls="partner-details"
                      onClick={() => setSelected(item.id)}
                    >
                      <img src={item.logo} alt="" width="64" height="64" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="partnership-controls">
        <span className="eyebrow">One constellation. Shared ambition.</span>
      </div>
      <div
        id="partner-details"
        className="partner-list partnership-details"
        hidden={!partner}
        aria-live="polite"
        aria-atomic="true"
      >
        {partner && (
          <div key={partner.id} className="partnership-reveal">
            {partner.content}
          </div>
        )}
      </div>
    </section>
  );
}
