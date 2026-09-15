const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
function setup() {
  const storage = new Map(), calls = [], redirects = [];
  const location = { search: '', pathname: '/zodiac/account.html', assign: url => redirects.push(url) };
  const config = { enabled: true, shopDomain: 'zodiac.myshopify.com', clientId: 'public-client',
    customerApiUrl: 'https://customer.test/graphql', rewardsApiUrl: 'https://api.test' };
  const context = { window: {}, document: { currentScript: { src: 'https://zodiac.test/zodiac/js/account-auth.js' } },
    URL, URLSearchParams, Uint8Array, TextEncoder, AbortSignal, crypto: webcrypto, btoa, atob,
    location, history: { replaceState: () => { location.search = ''; } },
    sessionStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    fetch: async (url, options) => {
      url = String(url); calls.push({ url, options });
      let value;
      if (url.endsWith('data/account.json')) value = config;
      else if (url.endsWith('openid-configuration')) value = { authorization_endpoint: 'https://auth.test/authorize', token_endpoint: 'https://auth.test/token', end_session_endpoint: 'https://auth.test/logout' };
      else if (url.endsWith('/token')) value = { access_token: 'verified-access', expires_in: 3600,
        id_token: 'header.' + btoa(JSON.stringify({ nonce: 'nonce' })) + '.signature' };
      else if (url.endsWith('/graphql')) value = { data: { customer: { id: 'gid://shopify/Customer/10', displayName: 'Supporter' } } };
      else value = { stars: 100 };
      return { ok: true, json: async () => value };
    } };
  vm.runInNewContext(fs.readFileSync('js/account-auth.js', 'utf8'), context);
  return { auth: context.window.ZodiacAccount, storage, calls, redirects, location, config };
}
(async () => {
  const login = setup();
  await login.auth.login();
  const url = new URL(login.redirects[0]);
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://zodiac.test/zodiac/account.html');
  const flow = JSON.parse(login.storage.get('zodiac.login'));
  assert.equal(url.searchParams.get('state'), flow.state);
  assert.equal(flow.verifier.length, 43);
  assert.equal(url.searchParams.get('code_challenge'), Buffer.from(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(flow.verifier))).toString('base64url'));
  login.location.search = '?code=untrusted&state=wrong';
  await assert.rejects(login.auth.callback(), /expired/);
  assert.equal(login.storage.has('zodiac.login'), false);
  assert.equal(login.calls.some(call => call.url.endsWith('/token')), false);

  const callback = setup();
  callback.storage.set('zodiac.login', JSON.stringify({ state: 'state', nonce: 'nonce', verifier: 'verifier', created: Date.now(), redirect: 'https://zodiac.test/zodiac/account.html' }));
  callback.location.search = '?code=good&state=state';
  await callback.auth.callback();
  assert.equal(callback.auth.session().access_token, 'verified-access');
  assert.equal(callback.location.search, '');
  assert.equal((await callback.auth.customer()).displayName, 'Supporter');
  await callback.auth.rewards();
  assert.equal(callback.calls.at(-1).options.headers.Authorization, 'Bearer verified-access');
  await callback.auth.redeem('request-id');
  assert.equal(JSON.parse(callback.calls.at(-1).options.body).requestId, 'request-id');
  await callback.auth.logout();
  assert.equal(callback.auth.session(), null);
  assert.equal(new URL(callback.redirects.at(-1)).pathname, '/logout');

  const expired = setup();
  expired.storage.set('zodiac.customer', JSON.stringify({ access_token: 'expired', expires: Date.now() - 1 }));
  assert.equal(expired.auth.session(), null);
  const disabled = setup(); disabled.config.enabled = false;
  await assert.rejects(disabled.auth.login(), /not open/);
  console.log('Account checks passed: PKCE, callback state, tab session, expiry, authenticated requests, redemption, and logout.');
})().catch(error => { console.error(error); process.exitCode = 1; });
