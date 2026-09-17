/* Shopify public-client OAuth: PKCE, one-use state, and tab-scoped sessions. */
window.ZodiacAccount = (() => {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const sessionKey = 'zodiac.customer',
    flowKey = 'zodiac.login';
  let settings, discovery;
  const json = async (url, options = {}) => {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Account service unavailable. Please try again.');
    return response.json();
  };
  const https = (value) => {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new Error('Invalid account configuration.');
    return url.href;
  };
  async function config() {
    if (!settings) settings = await json(new URL('data/account.json', root), { cache: 'no-store' });
    return settings;
  }
  async function endpoints() {
    const c = await config();
    if (!c.enabled) throw new Error('Customer accounts are not open yet.');
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(c.shopDomain) || !c.clientId)
      throw new Error('Invalid account configuration.');
    if (!discovery)
      discovery = await json(`https://${c.shopDomain}/.well-known/openid-configuration`);
    return discovery;
  }
  const encode = (bytes) =>
    btoa(String.fromCharCode(...bytes))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
  const random = () => encode(crypto.getRandomValues(new Uint8Array(32)));
  function session() {
    try {
      const s = JSON.parse(sessionStorage.getItem(sessionKey));
      if (s && s.expires > Date.now() + 30000 && typeof s.access_token === 'string') return s;
    } catch {
      /* Missing or expired session. */
    }
    sessionStorage.removeItem(sessionKey);
    return null;
  }
  async function login() {
    const c = await config(),
      d = await endpoints();
    const verifier = random(),
      state = random(),
      nonce = random();
    const redirect = new URL('account.html', root).href;
    const challenge = encode(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))),
    );
    sessionStorage.setItem(
      flowKey,
      JSON.stringify({ verifier, state, nonce, redirect, created: Date.now() }),
    );
    const url = new URL(https(d.authorization_endpoint));
    url.search = new URLSearchParams({
      client_id: c.clientId,
      response_type: 'code',
      redirect_uri: redirect,
      scope: 'openid email customer-account-api:full',
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    location.assign(url.href);
  }
  async function callback() {
    const params = new URLSearchParams(location.search);
    if (!params.has('code') && !params.has('error')) return;
    const stored = sessionStorage.getItem(flowKey);
    sessionStorage.removeItem(flowKey);
    history.replaceState({}, '', location.pathname);
    const flow = JSON.parse(stored || 'null');
    if (!flow || params.get('state') !== flow.state || Date.now() - flow.created > 600000)
      throw new Error('Sign-in expired. Please sign in again.');
    if (params.has('error')) throw new Error('Sign-in was cancelled. You can try again.');
    const c = await config(),
      d = await endpoints();
    const token = await json(https(d.token_endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: c.clientId,
        code: params.get('code'),
        redirect_uri: flow.redirect,
        code_verifier: flow.verifier,
      }),
    });
    // Identity is checked against Shopify's API; decoded JWT claims are never used as identity.
    const payload = JSON.parse(
      atob(token.id_token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')),
    );
    if (payload.nonce !== flow.nonce || !token.access_token || !(token.expires_in > 0))
      throw new Error('Could not verify sign-in. Please try again.');
    sessionStorage.setItem(
      sessionKey,
      JSON.stringify({
        access_token: token.access_token,
        id_token: token.id_token,
        expires: Date.now() + Number(token.expires_in) * 1000,
      }),
    );
  }
  async function customer() {
    const c = await config(),
      s = session();
    if (!s) return null;
    const result = await json(https(c.customerApiUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: s.access_token },
      body: JSON.stringify({
        query: '{ customer { id displayName emailAddress { emailAddress } } }',
      }),
    });
    if (result.errors || !result.data?.customer) {
      sessionStorage.removeItem(sessionKey);
      throw new Error('Your session ended. Please sign in again.');
    }
    return result.data.customer;
  }
  async function rewards() {
    const c = await config(),
      s = session();
    if (!s) throw new Error('Please sign in to view Stars.');
    if (!c.rewardsApiUrl) throw new Error('Stars are not available yet.');
    return json(https(c.rewardsApiUrl).replace(/\/$/, '') + '/me/stars', {
      headers: { Authorization: `Bearer ${s.access_token}` },
    });
  }
  async function redeem(requestId) {
    const c = await config(),
      s = session();
    if (!s) throw new Error('Please sign in again.');
    const response = await fetch(https(c.rewardsApiUrl).replace(/\/$/, '') + '/me/redeem', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not redeem Stars. Please try again.');
    return result;
  }
  async function logout() {
    const s = session();
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem(flowKey);
    const d = await endpoints();
    const url = new URL(https(d.end_session_endpoint));
    if (s?.id_token) url.searchParams.set('id_token_hint', s.id_token);
    url.searchParams.set('post_logout_redirect_uri', new URL('account.html', root).href);
    location.assign(url.href);
  }
  return { config, login, callback, customer, rewards, redeem, logout, session };
})();
