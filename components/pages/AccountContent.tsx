import CommerceConstellation from '../CommerceConstellation';
import PageLink from '../PageLink';
import AccountTiers from '../AccountTiers';

export default function AccountContent() {
  return (
    <>
      <section className="hero account-hero commerce-hero">
        <div className="commerce-hero-copy">
          <p className="eyebrow">Written in the Stars / Zodiac membership</p>
          <h1>Your support. Your Stars.</h1>
          <p>
            Wear the team. Earn your Stars. From your first purchase to your next milestone, there
            is a place for you in our constellation.
          </p>
        </div>
        <CommerceConstellation />
      </section>
      <section className="profile-section account-dashboard" aria-label="Your account">
        <p className="eyebrow">Your personal orbit</p>
        <h2>Your Zodiac account</h2>
        <p id="account-status" role="status">
          Loading your account…
        </p>
        <button id="account-login" type="button" hidden>
          Sign in / Create account
        </button>
        <div id="member-panel" hidden>
          <h2 id="member-name">Zodiac supporter</h2>
          <p className="eyebrow" id="member-tier"></p>
          <p id="tier-progress"></p>
          <p className="stars-total">
            <span aria-hidden="true">★</span> <strong id="stars-balance">—</strong> Stars
          </p>
          <p id="stars-status" role="status"></p>
          <button id="stars-refresh" type="button">
            Refresh Stars
          </button>
          <h3>Redeem your Stars</h3>
          <p id="reward-rule"></p>
          <button id="stars-redeem" type="button" disabled>
            Redeem Stars
          </button>
          <p id="redemption-status" role="status"></p>
          <ul id="reward-codes"></ul>
          <h3>Your recent purchases</h3>
          <ul id="stars-history"></ul>
          <button id="account-logout" type="button">
            Sign out
          </button>
        </div>
        <p>
          <PageLink href="store.html" documentNavigation>
            Explore the merch store →
          </PageLink>
        </p>
      </section>
      <AccountTiers />
      <section className="profile-section stars-explainer">
        <p className="eyebrow">A little support goes a long way</p>
        <h2>Rep the team. Reach for the stars.</h2>
        <p>
          Stars celebrate your support for Zodiac. Sign in before checkout so your purchases are
          connected to your account. Your account shows the current earning rule and confirmed
          Stars.
        </p>
        <p>
          Redeem available Stars for merchandise discounts. Your lifetime Stars unlock Zodiac
          Bronze, Zodiac Silver, Zodiac Gold, Zodiac Diamond, and finally Zodiac Nebula. Spending
          Stars never lowers your tier; refunds and cancellations adjust your earned Stars.
        </p>
      </section>
    </>
  );
}
