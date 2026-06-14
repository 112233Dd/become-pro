# Production Launch QA Plan

## Goal

Verify and repair the complete Become Pro customer journey before production launch, then publish and re-check the official deployment.

## Steps

1. Preserve and review the existing uncommitted hero-video change.
2. Reproduce product-page, cart, mobile CTA, form, FAQ, and player-page issues in the browser.
3. Add focused regression tests for every confirmed defect.
4. Repair shared storefront rendering, cart persistence, checkout routing, training form content, FAQ copy, homepage options, and player placeholders.
5. Run the full automated test suite and syntax checks.
6. Verify desktop and mobile layouts for the homepage, all six product pages, cart, checkout, training form, players, and footer.
7. Verify that Stripe Checkout starts without completing a charge and that the training request API/admin flow is reachable.
8. Commit all approved local changes to `main`, push to GitHub, and verify the Vercel production deployment.
