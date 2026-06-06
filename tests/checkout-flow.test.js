const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("online program buttons use cart and Stripe checkout instead of the training form", () => {
  const shop = read("shop.js");
  const checkoutSlice = shop.slice(shop.indexOf("const startStripeCheckout"), shop.indexOf("const renderProductGrid"));

  assert.match(shop, /data-shop-add/);
  assert.match(shop, /data-shop-buy/);
  assert.match(shop, /data-shop-checkout/);
  assert.match(shop, /localStorage\.setItem\(SHOP_CART_KEY/);
  assert.match(shop, /data-cart-count/);
  assert.match(checkoutSlice, /fetch\("\/api\/create-checkout-session"/);
  assert.doesNotMatch(checkoutSlice, /contact\.html|training\.html|survey|questionnaire|anket/i);
});

test("cart page renders products, prices, total, remove actions, and checkout CTA", () => {
  const cartHtml = read("cart.html");
  const shop = read("shop.js");

  assert.match(cartHtml, /data-cart-page/);
  assert.match(shop, /getCartPrograms\(\)/);
  assert.match(shop, /cart-item/);
  assert.match(shop, /cart-summary-total/);
  assert.match(shop, /\$\{program\.price\}/);
  assert.match(shop, /formatProgramPrice\(total\)/);
  assert.match(shop, /data-shop-remove/);
  assert.match(shop, /data-shop-checkout/);
});

test("checkout endpoint accepts cart items and creates a Stripe Checkout Session", () => {
  const endpoint = read("api/create-checkout-session.js");
  const shared = read("api/_shared.js");

  assert.match(endpoint, /Array\.isArray\(body\.items\)/);
  assert.match(endpoint, /createStripeCheckoutSession/);
  assert.match(endpoint, /status:\s*"pending"/);
  assert.match(endpoint, /url:\s*session\.url/);
  assert.match(shared, /STRIPE_API_VERSION\s*=\s*"2026-02-25\.clover"/);
  assert.match(shared, /mode",\s*"payment"/);
  assert.match(shared, /success_url/);
  assert.match(shared, /cancel_url/);
  assert.match(shared, /metadata\[/);
  assert.match(shared, /payment_intent_data\[metadata\]/);
  assert.match(shared, /line_items\[/);
  assert.match(shared, /Stripe-Version/);
});

test("webhook is the only place that fulfills successful payments", () => {
  const webhook = read("api/stripe/webhook.js");
  const successPage = read("checkout/success/index.html");

  assert.match(webhook, /verifyStripeSignature/);
  assert.match(webhook, /checkout\.session\.completed/);
  assert.match(webhook, /status:\s*"paid"/);
  assert.match(webhook, /upsertOrders/);
  assert.match(webhook, /sendFulfillmentEmails/);
  assert.doesNotMatch(webhook, /VIBER_GROUP_LINK|formatViberBlock/);
  assert.doesNotMatch(successPage, /upsertOrders|sendFulfillmentEmails|programLink/i);
});

test("program catalog uses the real access link for each program", () => {
  const shared = read("api/_shared.js");

  assert.match(shared, /PROGRAM_LINKS/);
  assert.match(shared, /1qS-VwiYIMCZ0Mw2mxOouFr7Y97Mq7iNl/);
  assert.match(shared, /1MK_AsqPkBwZWU0-6hVgBk3iROQ0DMRfm/);
  assert.match(shared, /1atcTXsukVSr3lWvggcfEdqvHCbTZIfLF/);
  assert.match(shared, /10PK5AIcqO8xb1Xx4gzKWxIUG_pS96HO_/);
  assert.match(shared, /1OXwQyMSRqO-e10RVv-fl16YiF1fMA0Lk/);
  assert.match(shared, /16x5DuIX8f7p7UyZNQ972EKU1YSEGLBQX/);
});

test("success and cancel pages exist for Stripe redirects", () => {
  const successPage = read("checkout/success/index.html");
  const cancelPage = read("checkout/cancel/index.html");

  assert.match(successPage, /data-success-program/);
  assert.match(successPage, /api\/checkout-session/);
  assert.match(cancelPage, /cart\.html/);
  assert.match(cancelPage, /programs\.html#programs/);
});

test("all programs use the temporary live EUR 0.50 price in storefront and Stripe", () => {
  const shop = read("shop.js");
  const shared = read("api/_shared.js");

  assert.equal((shop.match(/price:\s*"€0\.50"/g) || []).length, 6);
  assert.equal((shared.match(/price:\s*0\.5,/g) || []).length, 6);
  assert.equal((shared.match(/priceCents:\s*50,/g) || []).length, 6);
  assert.doesNotMatch(shop, /€49\.99/);
  assert.doesNotMatch(shared, /priceCents:\s*4999/);
});

test("training CTA opens the survey and Results is publicly named Players", () => {
  const training = read("training.html");
  const players = read("players.html");
  const publicPages = [
    "index.html",
    "programs.html",
    "training.html",
    "coach.html",
    "players.html",
    "faq.html",
    "contact.html",
    "cart.html",
    "checkout.html",
    "checkout/success/index.html",
    "checkout/cancel/index.html",
    "programs/technical-pack/index.html",
    "programs/strength-level-1/index.html",
    "programs/strength-level-2/index.html",
    "programs/strength-level-3/index.html",
    "programs/summer-program/index.html",
    "programs/matchday-pack/index.html",
  ].map(read);

  assert.match(training, /href="contact\.html">Попълни анкетата<\/a>/);
  assert.match(players, /<title>Играчи \| Become Pro<\/title>/);
  publicPages.forEach((page) => assert.doesNotMatch(page, />Резултати<\/a>/));
});
