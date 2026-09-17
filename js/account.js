(async () => {
  'use strict';
  const el = (id) => document.getElementById(id),
    auth = window.ZodiacAccount;
  const status = (message) => {
    el('account-status').textContent = message;
  };
  const action = (id, fn) => {
    el(id).onclick = async () => {
      el(id).disabled = true;
      try {
        await fn();
      } catch (error) {
        status(error.message);
      } finally {
        el(id).disabled = id === 'stars-redeem' ? !canRedeem : false;
      }
    };
  };
  action('account-login', auth.login);
  action('account-logout', async () => {
    el('member-panel').hidden = true;
    await auth.logout();
  });
  let reward,
    canRedeem = false;
  action('stars-redeem', async () => {
    if (!reward || !canRedeem) return;
    const key = 'zodiac.redemption.' + auth.session().access_token.slice(-24);
    let requestId = sessionStorage.getItem(key);
    if (!requestId) {
      requestId = crypto.randomUUID();
      sessionStorage.setItem(key, requestId);
    }
    await auth.redeem(requestId);
    sessionStorage.removeItem(key);
    el('redemption-status').textContent =
      'Stars reserved. Your discount code is being prepared. Refresh in a moment.';
    await stars();
  });
  async function stars() {
    el('stars-status').textContent = 'Loading your Stars…';
    try {
      const result = await auth.rewards();
      el('stars-balance').textContent = new Intl.NumberFormat().format(result.stars);
      el('member-tier').textContent = result.tier;
      el('tier-progress').textContent =
        `${result.lifetimeStars} lifetime Stars. ` +
        (result.nextTier
          ? `${result.nextTier.stars - result.lifetimeStars} more to ${result.nextTier.name}.`
          : 'You’ve reached Zodiac Nebula, our highest tier.');
      reward = result.reward;
      canRedeem = result.stars >= reward.redemptionStars;
      el('stars-redeem').disabled = !canRedeem;
      el('stars-redeem').textContent =
        `Redeem ${reward.redemptionStars} Stars for $${reward.discountAmount} off`;
      el('reward-rule').textContent =
        `On purchases of $${reward.minimumPurchase} ${reward.currency} or more. Each code is for your account, can be used once, and cannot combine with other discounts. Stars are spent when the code is issued.`;
      el('reward-codes').replaceChildren();
      for (const redemption of result.redemptions) {
        const row = document.createElement('li');
        row.textContent =
          redemption.status === 'READY'
            ? `${redemption.code} — $${redemption.amount} off purchases of $${redemption.minimumPurchase}+. Enter at Shopify checkout; previously used codes remain in this history.`
            : 'Your discount is being prepared. Refresh to check its progress.';
        el('reward-codes').append(row);
      }
      el('stars-status').textContent = result.policy;
      el('stars-history').replaceChildren();
      for (const order of result.orders) {
        const row = document.createElement('li');
        row.textContent = `${order.name}: ${order.stars} Stars`;
        el('stars-history').append(row);
      }
      if (!result.orders.length)
        el('stars-status').textContent += ' Your first completed purchase will appear here.';
    } catch (error) {
      el('stars-status').textContent = error.message;
      canRedeem = false;
      el('stars-redeem').disabled = true;
    }
  }
  action('stars-refresh', stars);
  try {
    const c = await auth.config();
    if (!c.enabled) {
      status('Customer accounts and Stars are coming soon. You can still browse our store.');
      return;
    }
    el('account-login').hidden = false;
    await auth.callback();
    const customer = await auth.customer();
    if (!customer) {
      status('Sign in with Shopify to shop with your Zodiac account and see your Stars.');
      return;
    }
    el('account-login').hidden = true;
    el('member-panel').hidden = false;
    el('member-name').textContent = customer.displayName || 'Zodiac supporter';
    status('You’re signed in. Stars update after Shopify confirms your order.');
    await stars();
  } catch (error) {
    status(error.message);
  }
})();
