import PageLink from '../PageLink';
import CommerceConstellation from '../CommerceConstellation';

export default function StoreContent() {
  return (
    <>
      <section className="hero shop-hero commerce-hero">
        <div className="commerce-hero-copy">
          <p className="eyebrow">Zodiac Esports / Store</p>
          <h1>Wear your allegiance.</h1>
          <p>Bring Zodiac with you. Explore the official team collection.</p>
          <PageLink className="shop-link" href="#collection" documentNavigation>
            Explore the collection ↓
          </PageLink>
        </div>
        <CommerceConstellation />
      </section>
      <div className="shop-layout">
        <section id="collection" aria-labelledby="collection-heading">
          <div className="section-heading">
            <h2 id="collection-heading">The collection</h2>
          </div>
          <p id="store-status" role="status">
            Loading the collection…
          </p>
          <button id="store-retry" type="button" hidden>
            Try again
          </button>
          <div id="products" className="product-grid"></div>
          <button id="load-more" type="button" hidden>
            Load more products
          </button>
          <noscript>
            <p>Enable JavaScript to browse products and use the cart.</p>
          </noscript>
        </section>
        <aside className="shop-cart" aria-labelledby="cart-heading">
          <p className="eyebrow">Your selection</p>
          <h2 id="cart-heading">
            Shopping bag <span id="cart-count">(0)</span>
          </h2>
          <p>
            <PageLink href="account.html" documentNavigation>
              Sign in to earn Stars with your purchases.
            </PageLink>
          </p>
          <div id="cart-lines">
            <p>Your bag is empty. Find your next favorite in the collection.</p>
          </div>
          <div className="cart-total">
            <span>Estimated subtotal</span>
            <strong id="cart-total">—</strong>
          </div>
          <p className="shop-note">Shipping, taxes, and discounts are calculated at checkout.</p>
          <button id="checkout" type="button" disabled>
            Checkout
          </button>
          <p id="payment-note" className="shop-note">
            Secure checkout through Shopify.
          </p>
          <p id="cart-status" role="status"></p>
        </aside>
      </div>
    </>
  );
}
