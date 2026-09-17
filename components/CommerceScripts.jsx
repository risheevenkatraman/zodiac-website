'use client';
import { useEffect, useRef } from 'react';
import { asset } from '../lib/paths';

export default function CommerceScripts({ kind }) {
  const started = useRef(false);
  useEffect(() => {
    // Commerce uses full-document navigation to preserve the existing OAuth/cart lifecycle.
    if (started.current) return;
    started.current = true;
    async function load() {
      for (const file of ['account-auth.js', kind === 'store' ? 'store.js' : 'account.js']) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = asset(`js/${file}`);
          script.onload = resolve;
          script.onerror = reject;
          document.body.append(script);
        });
      }
    }
    load().catch(() => {
      const status = document.getElementById(kind === 'store' ? 'store-status' : 'account-status');
      if (status) status.textContent = 'Unable to load this service. Please refresh to try again.';
    });
  }, [kind]);
  return null;
}
