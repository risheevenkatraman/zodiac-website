// Exercise the storefront with a mocked Shopify service; no orders or payments.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
  constructor() {
    this.children = [];
    this.value = '';
    this.hidden = false;
  }
  append(...items) {
    this.children.push(...items);
    if (!this.value && items[0]?.value) this.value = items[0].value;
  }
  replaceChildren(...items) {
    this.children = items;
  }
  setAttribute() {}
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
async function setup({ configured = true, fail = false, warnings = false, signedIn = false } = {}) {
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  get('checkout').disabled = true;
  const calls = [],
    redirects = [];
  const context = {
    document: { getElementById: get, createElement: () => new Element() },
    Intl,
    URL,
    AbortSignal,
    window: {
      location: { assign: (url) => redirects.push(url) },
      ZodiacAccount: { session: () => (signedIn ? { access_token: 'customer-token' } : null) },
    },
    fetch: async (url, options) => {
      if (url === 'data/store.json')
        return {
          ok: true,
          json: async () =>
            configured
              ? {
                  domain: 'zodiac-test.myshopify.com',
                  publicStorefrontAccessToken: 'public-test',
                  apiVersion: '2026-07',
                }
              : {},
        };
      const request = JSON.parse(options.body);
      calls.push(request);
      if (fail) return { ok: false };
      const data = request.query.includes('mutation Checkout')
        ? {
            cartCreate: {
              userErrors: [],
              warnings: warnings ? [{ message: 'Stock has changed.' }] : [],
              cart: {
                checkoutUrl: 'https://zodiac-test.myshopify.com/checkouts/test',
                lines: {
                  nodes: request.variables.input.lines.map((line) => ({
                    quantity: line.quantity,
                    merchandise: { id: line.merchandiseId },
                  })),
                },
              },
            },
          }
        : {
            products: {
              pageInfo: { hasNextPage: false, endCursor: 'end' },
              nodes: [
                {
                  id: 'gid://shopify/Product/1',
                  title: 'Team jersey',
                  description: 'Test product',
                  featuredImage: null,
                  variants: {
                    pageInfo: { hasNextPage: false },
                    nodes: [
                      {
                        id: 'gid://shopify/ProductVariant/1',
                        title: 'S',
                        availableForSale: false,
                        price: { amount: '30', currencyCode: 'USD' },
                      },
                      {
                        id: 'gid://shopify/ProductVariant/2',
                        title: 'M',
                        availableForSale: true,
                        price: { amount: '35', currencyCode: 'USD' },
                      },
                    ],
                  },
                },
              ],
            },
          };
      return { ok: true, json: async () => ({ data }) };
    },
  };
  vm.runInNewContext(fs.readFileSync('js/store.js', 'utf8'), context);
  await tick();
  return { get, calls, redirects };
}
(async () => {
  const member = await setup({ signedIn: true });
  member.get('products').children[0].children[1].children[5].onclick();
  await member.get('checkout').onclick();
  assert.equal(
    member.calls.at(-1).variables.input.buyerIdentity.customerAccessToken,
    'customer-token',
  );
  const closed = await setup({ configured: false });
  assert.equal(closed.calls.length, 0);
  assert.equal(closed.get('checkout').disabled, true);
  assert.match(closed.get('store-status').textContent, /first collection/);
  const failed = await setup({ fail: true });
  assert.equal(failed.get('store-retry').hidden, false);
  assert.equal(failed.get('checkout').disabled, true);
  for (const warnings of [false, true]) {
    const shop = await setup({ warnings });
    const details = shop.get('products').children[0].children[1];
    const select = details.children[4],
      add = details.children[5];
    assert.equal(select.children[0].disabled, true);
    assert.equal(select.value, 'gid://shopify/ProductVariant/2');
    add.onclick();
    add.onclick();
    assert.equal(shop.get('cart-count').textContent, '(2)');
    assert.equal(shop.get('cart-total').textContent, '$70.00');
    await shop.get('checkout').onclick();
    const lines = shop.calls.at(-1).variables.input.lines;
    assert.equal(lines[0].quantity, 2);
    assert.equal(lines[0].merchandiseId, 'gid://shopify/ProductVariant/2');
    assert.equal(shop.redirects.length, warnings ? 0 : 1);
    if (warnings) assert.match(shop.get('cart-status').textContent, /Stock has changed/);
    const controls = shop.get('cart-lines').children[0].children[2];
    controls.children[0].onclick();
    assert.equal(shop.get('cart-count').textContent, '(1)');
    shop.get('cart-lines').children[0].children[2].children[3].onclick();
    assert.equal(shop.get('checkout').disabled, true);
  }
  console.log(
    'Store checks passed: launch state, API failure, variants, bag controls, checkout payload, and inventory warnings.',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
