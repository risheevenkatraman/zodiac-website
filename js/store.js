(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const variants = new Map();
  let config, cursor = null, cart = [], busy = false;
  const bagKey = 'zodiac.bag';
  function saveBag() {
    try {
      if (config) sessionStorage.setItem(bagKey, JSON.stringify({ domain: config.domain, saved: Date.now(),
        lines: cart.map(line => ({ ...line, variant: variants.get(line.merchandiseId) })) }));
    } catch { /* Shopping also works when browser storage is disabled. */ }
  }
  function restoreBag() {
    try {
      const draft = JSON.parse(sessionStorage.getItem(bagKey));
      if (!draft || draft.domain !== config.domain || Date.now() - draft.saved > 86400000 || !Array.isArray(draft.lines) || draft.lines.length > 250) return;
      const restored = [], seen = new Set();
      for (const line of draft.lines) {
        const v = line.variant;
        if (!/^gid:\/\/shopify\/ProductVariant\/[0-9]+$/.test(line.merchandiseId) || seen.has(line.merchandiseId)
          || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99
          || !v || typeof v.title !== 'string' || typeof v.productTitle !== 'string'
          || !v.price || !Number.isFinite(Number(v.price.amount)) || Number(v.price.amount) < 0
          || !/^[A-Z]{3}$/.test(v.price.currencyCode)) return;
        seen.add(line.merchandiseId);
        restored.push(line);
      }
      for (const line of restored) variants.set(line.merchandiseId, line.variant);
      cart = restored.map(({ merchandiseId, quantity }) => ({ merchandiseId, quantity }));
      drawCart();
    } catch { /* Ignore an expired or malformed bag. Shopify validates checkout. */ }
  }
  const money = value => new Intl.NumberFormat(undefined, {
    style: 'currency', currency: value.currencyCode
  }).format(Number(value.amount));
  function node(tag, text, className) {
    const result = document.createElement(tag);
    if (text !== undefined) result.textContent = text;
    if (className) result.className = className;
    return result;
  }
  async function api(query, variables = {}) {
    const response = await fetch(`https://${config.domain}/api/${config.apiVersion}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.publicStorefrontAccessToken },
      body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error('Shopify is unavailable. Please try again.');
    const payload = await response.json();
    if (payload.errors?.length || !payload.data) throw new Error('The store could not complete this request. Please try again.');
    return payload.data;
  }
  function drawCart() {
    el('cart-lines').replaceChildren();
    let count = 0, total = 0, currency;
    for (const line of cart) {
      const variant = variants.get(line.merchandiseId);
      count += line.quantity;
      total += Number(variant.price.amount) * line.quantity;
      currency = variant.price.currencyCode;
      const row = node('div', undefined, 'cart-line');
      row.append(node('strong', variant.productTitle), node('p', `${variant.title} · ${money(variant.price)}`));
      const controls = node('div', undefined, 'cart-controls');
      for (const [label, delta] of [['−', -1], ['+', 1]]) {
        const button = node('button', label);
        button.type = 'button';
        button.disabled = busy || (delta === 1 && line.quantity >= 99);
        button.setAttribute('aria-label', `${delta === 1 ? 'Increase' : 'Decrease'} quantity of ${variant.productTitle}, ${variant.title}`);
        button.onclick = () => {
          line.quantity += delta;
          cart = cart.filter(item => item.quantity > 0);
          el('cart-status').textContent = 'Bag updated.';
          drawCart();
        };
        controls.append(button);
        if (delta === -1) controls.append(node('span', String(line.quantity)));
      }
      const remove = node('button', 'Remove', 'remove-item');
      remove.type = 'button';
      remove.disabled = busy;
      remove.setAttribute('aria-label', `Remove ${variant.productTitle}, ${variant.title}`);
      remove.onclick = () => { cart = cart.filter(item => item !== line); drawCart(); el('cart-status').textContent = 'Item removed.'; };
      controls.append(remove);
      row.append(controls);
      el('cart-lines').append(row);
    }
    if (!cart.length) el('cart-lines').append(node('p', 'Your bag is empty. Find your next favorite in the collection.'));
    el('cart-count').textContent = `(${count})`;
    el('cart-total').textContent = currency ? money({ amount: total, currencyCode: currency }) : '—';
    el('checkout').disabled = busy || !cart.length;
    saveBag();
  }
  function productCard(product) {
    const card = node('article', undefined, 'product-card');
    const img = node('img');
    const source = product.featuredImage;
    img.src = source?.url?.startsWith('https://') ? source.url : 'assets/zodiac-logo.png';
    img.alt = source?.altText || product.title;
    img.loading = 'lazy';
    card.append(img);
    const details = node('div', undefined, 'product-details');
    details.append(node('h3', product.title), node('p', product.description, 'product-description'));
    const price = node('p');
    const label = node('label', 'Choose an option');
    const select = node('select');
    select.id = `variant-${product.id.split('/').pop()}`;
    label.htmlFor = select.id;
    for (const variant of product.variants.nodes) {
      variants.set(variant.id, { ...variant, productTitle: product.title });
      const option = node('option', `${variant.title}${variant.availableForSale ? '' : ' — Sold out'}`);
      option.value = variant.id;
      option.disabled = !variant.availableForSale;
      select.append(option);
    }
    const available = product.variants.nodes.find(v => v.availableForSale);
    if (available) select.value = available.id;
    const add = node('button', available ? 'Add to bag' : 'Sold out');
    add.type = 'button';
    add.disabled = !available;
    select.disabled = !available;
    const updatePrice = () => { const variant = variants.get(select.value); price.textContent = variant ? money(variant.price) : 'Unavailable'; };
    select.onchange = updatePrice;
    updatePrice();
    add.onclick = () => {
      if (busy) return;
      const variant = variants.get(select.value);
      if (!variant?.availableForSale) return;
      const existing = cart.find(line => line.merchandiseId === variant.id);
      if (existing?.quantity >= 99) { el('cart-status').textContent = 'Maximum quantity is 99 per option.'; return; }
      if (cart.length >= 250 && !existing) { el('cart-status').textContent = 'Your bag is full. Please check out before adding more.'; return; }
      if (existing) existing.quantity++;
      else cart.push({ merchandiseId: variant.id, quantity: 1 });
      drawCart();
      el('cart-status').textContent = `${product.title} added to your bag.`;
    };
    details.append(price, label, select, add);
    card.append(details);
    return card;
  }
  async function loadProducts() {
    el('store-retry').hidden = true;
    el('load-more').disabled = true;
    el('store-status').textContent = 'Loading the collection…';
    try {
      const data = await api(`query Products($after: String) {
        products(first: 12, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes { id title description(truncateAt: 180) featuredImage { url altText }
            variants(first: 250) { nodes { id title availableForSale price { amount currencyCode } }
              pageInfo { hasNextPage endCursor } }
          }
        }
      }`, { after: cursor });
      // Retrieve every option before rendering; some products exceed 250 variants.
      for (const product of data.products.nodes) {
        while (product.variants.pageInfo.hasNextPage) {
          const more = await api(`query Options($id: ID!, $after: String!) {
            product(id: $id) { variants(first: 250, after: $after) {
              nodes { id title availableForSale price { amount currencyCode } }
              pageInfo { hasNextPage endCursor }
            } }
          }`, { id: product.id, after: product.variants.pageInfo.endCursor });
          product.variants.nodes.push(...more.product.variants.nodes);
          product.variants.pageInfo = more.product.variants.pageInfo;
        }
      }
      for (const product of data.products.nodes) el('products').append(productCard(product));
      cursor = data.products.pageInfo.endCursor;
      el('load-more').hidden = !data.products.pageInfo.hasNextPage;
      el('store-status').textContent = el('products').children.length ? 'Choose your gear and make it yours.' : 'The next drop is on its way. Check back soon.';
    } catch {
      el('store-status').textContent = 'We couldn’t load the collection. Please try again.';
      el('store-retry').hidden = false;
    } finally { el('load-more').disabled = false; }
  }
  el('checkout').onclick = async () => {
    if (busy || !cart.length) return;
    busy = true;
    drawCart();
    el('checkout').textContent = 'Opening checkout…';
    el('cart-status').textContent = '';
    try {
      const data = await api(`mutation Checkout($input: CartInput!) {
        cartCreate(input: $input) {
          cart { checkoutUrl lines(first: 250) { nodes { quantity merchandise { ... on ProductVariant { id } } } } }
          userErrors { message }
          warnings { message }
        }
      }`, { input: { lines: cart, ...(window.ZodiacAccount?.session() ? {
        buyerIdentity: { customerAccessToken: window.ZodiacAccount.session().access_token }
      } : {}) } });
      const result = data.cartCreate;
      if (result.userErrors.length) throw new Error(result.userErrors.map(e => e.message).join(' '));
      if (result.warnings?.length) throw new Error(result.warnings.map(e => e.message).join(' '));
      const actual = result.cart?.lines.nodes;
      if (!actual || actual.length !== cart.length || cart.some(line => !actual.some(item => item.merchandise.id === line.merchandiseId && item.quantity === line.quantity))) {
        throw new Error('Availability has changed. Please adjust your bag and try again.');
      }
      const url = new URL(result.cart.checkoutUrl);
      if (url.protocol !== 'https:') throw new Error('Checkout is unavailable. Please try again.');
      window.location.assign(url.href);
    } catch (error) {
      el('cart-status').textContent = error.name === 'TimeoutError' ? 'Checkout took too long. Please try again.' : error.message;
    } finally {
      busy = false;
      el('checkout').textContent = 'Checkout';
      drawCart();
    }
  };
  el('load-more').onclick = loadProducts;
  el('store-retry').onclick = () => config ? loadProducts() : init();
  async function init() {
    try {
      const response = await fetch('data/store.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Configuration unavailable');
      const settings = await response.json();
      if (!settings.domain || !settings.publicStorefrontAccessToken) {
        el('store-status').textContent = 'Our first collection is on its way. Shopping will open here when the store launches.';
        el('payment-note').textContent = 'Checkout opens when the collection launches.';
        return;
      }
      if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(settings.domain) || !/^\d{4}-(01|04|07|10)$/.test(settings.apiVersion)) throw new Error('Invalid configuration');
      config = settings;
      restoreBag();
      if (config.shopPayEnabled === true) el('payment-note').textContent = 'Secure Shopify checkout. Choose Shop Pay at checkout where available.';
      await loadProducts();
    } catch {
      el('store-status').textContent = 'The store is temporarily unavailable. Please try again.';
      el('store-retry').hidden = false;
    }
  }
  init();
})();
