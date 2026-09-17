'use client';

import { useEffect, useState } from 'react';

const tiers = [
  { name: 'Bronze', color: '#c98b57' },
  { name: 'Silver', color: '#cbd1dc' },
  { name: 'Gold', color: '#ebc568' },
  { name: 'Diamond', color: '#75e2ee' },
  { name: 'Nebula', color: '#c777ff' },
];

export default function AccountTiers() {
  const [currentTier, setCurrentTier] = useState('');
  useEffect(() => {
    const label = document.getElementById('member-tier');
    const member = document.getElementById('member-panel');
    if (!label || !member) return;
    const update = () => setCurrentTier(member.hidden ? '' : label.textContent);
    const observer = new MutationObserver(update);
    observer.observe(label, { childList: true, characterData: true, subtree: true });
    observer.observe(member, { attributes: true, attributeFilter: ['hidden'] });
    update();
    return () => observer.disconnect();
  }, []);

  return (
    <section className="membership-tiers" aria-labelledby="tiers-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your place in the constellation</p>
          <h2 id="tiers-heading">Every star takes you further.</h2>
        </div>
        <p>
          Five lifetime tiers.
          <br />
          One shared sky.
        </p>
      </div>

      <ol className="tier-map">
        {tiers.map((tier, index) => (
          <li
            key={tier.name}
            className="membership-tier"
            style={{ '--tier-color': tier.color }}
            data-current={currentTier === `Zodiac ${tier.name}` ? 'true' : undefined}
          >
            <span className="tier-number" aria-hidden="true">
              0{index + 1}
            </span>
            <span className="tier-color-dot" aria-hidden="true" />
            <span className="tier-brand">Zodiac</span>
            <h3>{tier.name}</h3>
            {currentTier === `Zodiac ${tier.name}` && (
              <p className="current-tier-label">Your current tier</p>
            )}
          </li>
        ))}
      </ol>

      <p className="tier-footnote">
        Earn Stars with eligible purchases. Your lifetime Stars determine your tier; redeeming Stars
        never lowers it.
      </p>
    </section>
  );
}
