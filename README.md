# Zodiac Esports Website

Zodiac Esports is a static organization website for showcasing the organization's Overwatch and VALORANT teams, rosters, staff, announcements, events, and social links.

## Stack

- **Frontend:** HTML5, CSS3, and vanilla JavaScript for roster search, announcements,
  and the current-month events calendar.
- **Content:** JSON files in `data/` for players, staff, announcements, manual events,
  and FACEIT match sources; SVG, PNG, JPEG, and WebP assets.
- **Generation and automation:** Python 3 (3.12 in CI) with standard-library scripts
  to generate player/staff pages and sync match schedules.
- **Match data:** FACEIT Data API, authenticated with the `FACEIT_API_KEY` GitHub
  Actions secret. Reference matches identify each team's championship; imported
  events include opponents, dates, and competition/division names.
- **Hosting and deployment:** GitHub Pages, published directly from GitHub Actions
  with `configure-pages`, `upload-pages-artifact`, and `deploy-pages`. Deployments
  run on pushes to `main`, manual runs, and a daily 10:17 UTC schedule.
- **Validation:** Python `unittest` for the importer, Python site/link checks, and
  Node.js scripts for event parsing and roster search.

The deployed site is static: it has no application server or database. Python
runs during content generation and automation; browsers load the resulting HTML,
assets, and JSON. Local Windows Python may need `tzdata` for match time zones.

## Store and Shop Pay

`store.html` provides a responsive product collection, variant selection, shopping
bag, and Shopify-hosted checkout. Products, prices, and availability come from the
Shopify Storefront API; no payment details are collected by this site. The bag is
kept in memory for the current page visit. Shopify rechecks inventory and calculates
final pricing, shipping, taxes, and discounts at checkout.

To connect the store:

1. Create a Shopify store, add real merchandise with images and variants, and
   configure shipping, payment methods, and store policies in Shopify.
2. Add Shopify's Headless sales channel, create a storefront, and publish the
   products to that channel. Enable Storefront API permissions for reading products
   and creating carts/checkouts (`unauthenticated_read_product_listings`,
   `unauthenticated_write_checkouts`, and `unauthenticated_read_checkouts`).
3. Edit `data/store.json`: set `domain` to your `your-store.myshopify.com` hostname
   and `publicStorefrontAccessToken` to the **public** Storefront token. This file
   is public: never put an Admin API token, private Storefront token, or secret here.
   The API version is pinned to `2026-07`; review it before Shopify retires it.
4. Activate Shop Pay under Shopify Settings → Payments. Set `shopPayEnabled` to
   `true` only once enabled; this flag controls messaging, not payment activation.
5. Serve the site over HTTP (for example `python -m http.server 8000`) and open
   `/store.html`. Verify products, sold-out options, cart changes, and checkout on
   mobile and desktop. Use Shopify's payment testing setup to verify an order
   before launch, then verify Shop Pay availability with an eligible checkout.

Until configuration is supplied, the collection shows a launch message and
checkout stays disabled. API failures show retry controls. Checkout errors or
inventory adjustments keep shoppers on the page with their bag intact.

References: [Shopify cart integration](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage)
and [activating Shop Pay](https://help.shopify.com/en/manual/payments/shop-pay/activating-shop-pay).

Store checks: `node --check js/store.js` and `node scripts/check_store.cjs`.
