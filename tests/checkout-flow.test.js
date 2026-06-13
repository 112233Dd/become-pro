const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const ADD_TO_CART_BUTTON =
  /<button\b[^>]*data-shop-add\s*=\s*["']\$\{program\.id\}["'][^>]*>\s*Добави в количка\s*<\/button>/i;
const BUY_PROGRAM_BUTTON =
  /<button\b[^>]*data-shop-buy\s*=\s*["']\$\{program\.id\}["'][^>]*>\s*Купи програмата\s*<\/button>/i;
const STATIC_PROGRAM_CARD =
  /<article\b[^>]*\bclass\s*=\s*["'][^"']*\bprogram-card\b[^"']*["'][^>]*>/i;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function extractNamedDeclaration(source, name) {
  const declarationPattern = new RegExp(`^(?:const|let|var)\\s+${name}\\b|^function\\s+${name}\\b`, "m");
  const declaration = declarationPattern.exec(source);

  assert.ok(declaration, `Missing ${name} declaration`);

  const start = declaration.index;
  const remainder = source.slice(start + declaration[0].length);
  const nextDeclaration = /^(?:const|let|var)\s+\w+\b|^function\s+\w+\b/m.exec(remainder);
  const end = nextDeclaration ? start + declaration[0].length + nextDeclaration.index : source.length;

  assert.ok(end > start, `Invalid ${name} declaration boundaries`);
  return source.slice(start, end);
}

function extractHtmlSection(source, className) {
  const openingPattern = new RegExp(
    `<section\\b[^>]*\\bclass\\s*=\\s*["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`,
    "i",
  );
  const opening = openingPattern.exec(source);

  assert.ok(opening, `Missing .${className} section`);

  const start = opening.index;
  const endMarker = "</section>";
  const endMarkerIndex = source.indexOf(endMarker, start + opening[0].length);

  assert.notEqual(endMarkerIndex, -1, `Missing closing tag for .${className}`);

  const end = endMarkerIndex + endMarker.length;
  assert.ok(end > start, `Invalid .${className} section boundaries`);
  return source.slice(start, end);
}

test("online program buttons use cart and Stripe checkout instead of the training form", () => {
  const shop = read("shop.js");
  const checkoutSlice = extractNamedDeclaration(shop, "startStripeCheckout");

  assert.match(shop, /data-shop-add/, "Missing add-to-cart control");
  assert.match(shop, /data-shop-buy/, "Missing direct-buy control");
  assert.match(shop, /data-shop-checkout/, "Missing checkout control");
  assert.match(shop, /localStorage\.setItem\(SHOP_CART_KEY/, "Cart is not persisted");
  assert.match(shop, /data-cart-count/, "Missing cart count hook");
  assert.match(checkoutSlice, /fetch\(\s*["']\/api\/create-checkout-session["']/, "Checkout API is not called");
  assert.doesNotMatch(
    checkoutSlice,
    /contact\.html|training\.html|survey|questionnaire|anket/i,
    "Checkout still redirects to the training flow",
  );
});

test("add-to-cart controls support mobile touch feedback", () => {
  const shop = read("shop.js");

  assert.match(shop, /markAddedButton/);
  assert.match(shop, /button\.textContent\s*=\s*"Добавено"/);
  assert.match(shop, /document\.addEventListener\(\s*"pointerup"/);
  assert.match(shop, /document\.addEventListener\(\s*"touchend"/);
  assert.match(shop, /lastMobileAddToCartAt/);
  assert.match(shop, /handleAddToCartAction\(addButton,\s*event\)/);
  assert.match(shop, /event\?\.preventDefault\?\.\(\)/);
  assert.match(shop, /event\?\.stopPropagation\?\.\(\)/);
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
  assert.match(webhook, /ensureFulfillmentPayload/);
  assert.match(webhook, /formatViberBonusForEmail/);
  assert.doesNotMatch(successPage, /upsertOrders|sendFulfillmentEmails|programLink/i);
});

test("Stripe checkout and webhook preserve program identity for fulfillment", () => {
  const shared = read("api/_shared.js");
  const webhook = read("api/stripe/webhook.js");

  assert.match(shared, /body\.append\(`metadata\[\$\{key\}\]`/);
  assert.match(shared, /body\.append\(`payment_intent_data\[metadata\]\[\$\{key\}\]`/);
  assert.match(shared, /product_data\]\[metadata\]\[programId\]/);
  assert.match(shared, /listCheckoutSessionLineItems/);
  assert.match(shared, /getProgramsFromCheckoutLineItems/);
  assert.match(webhook, /programsFromSession/);
  assert.match(webhook, /listCheckoutSessionLineItems/);
  assert.match(webhook, /getProgramsFromCheckoutLineItems/);
});

test("fulfillment email requires Google Drive links and logs missing access data", () => {
  const shared = read("api/_shared.js");
  const webhook = read("api/stripe/webhook.js");
  const schema = read("supabase/schema.sql");
  const adminLogsEndpoint = read("api/admin/logs.js");
  const adminHtml = read("admin-orders.html");
  const adminScript = read("admin-orders.js");

  assert.match(shared, /validateProgramAccessLinks/);
  assert.match(shared, /drive\.google\.com/);
  assert.match(shared, /logAdminEvent/);
  assert.match(webhook, /fulfillment_access_link_missing/);
  assert.match(webhook, /Fulfillment email was not sent/);
  assert.match(webhook, /formatProgramsForEmail\(programs\)\}\$\{formatViberBonusForEmail\(\)\}/);
  assert.match(webhook, /become\.pro2024@gmail\.com/);
  assert.match(schema, /create table if not exists public\.admin_logs/);
  assert.match(adminLogsEndpoint, /admin_logs\?select=/);
  assert.match(adminHtml, /data-admin-logs/);
  assert.match(adminScript, /\/api\/admin\/logs/);
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

test("all programs use the temporary live EUR 0.10 price in storefront and Stripe", () => {
  const shop = read("shop.js");
  const shared = read("api/_shared.js");

  assert.equal((shop.match(/price:\s*"€0\.10"/g) || []).length, 6);
  assert.equal((shared.match(/price:\s*0\.1,/g) || []).length, 6);
  assert.equal((shared.match(/priceCents:\s*10,/g) || []).length, 6);
  assert.doesNotMatch(shop, /€49\.99/);
  assert.doesNotMatch(shared, /priceCents:\s*4999/);
});

test("all six storefront programs render the visible EUR 0.10 price", () => {
  const shop = read("shop.js");
  const cardRenderer = extractNamedDeclaration(shop, "renderProgramCard");

  assert.match(
    cardRenderer,
    /<([a-z][\w-]*)\b[^>]*\bclass\s*=\s*["'][^"']*\bprogram-price\b[^"']*["'][^>]*>\s*\$\{program\.price\}\s*<\/\1>/i,
    "Program cards must render program.price inside .program-price",
  );
});

test("storefront renders all six shop programs through the shared card renderer", () => {
  const shop = read("shop.js");
  const catalog = extractNamedDeclaration(shop, "shopPrograms");
  const storefrontRenderer = extractNamedDeclaration(shop, "renderProgramStorefront");

  assert.equal((catalog.match(/\bid\s*:/g) || []).length, 6, "shopPrograms must contain six programs");
  assert.equal((catalog.match(/price\s*:\s*["']€0\.10["']/g) || []).length, 6, "Every program must cost €0.10");
  assert.match(storefrontRenderer, /\bshopPrograms\b/, "Storefront must use shopPrograms");
  assert.match(storefrontRenderer, /\.map\s*\(/, "Storefront must iterate over all programs");
  assert.match(storefrontRenderer, /\brenderProgramCard\s*\(/, "Storefront must use the shared card renderer");
});

test("renderProgramStorefront mounts the shared cards when the storefront marker exists", () => {
  const shop = read("shop.js");
  const storefrontRenderer = extractNamedDeclaration(shop, "renderProgramStorefront");
  const productDetailRenderer = extractNamedDeclaration(shop, "renderProductDetail");
  const initialization = shop.replace(storefrontRenderer, "").replace(productDetailRenderer, "");

  assert.match(
    storefrontRenderer,
    /document\.querySelector\(\s*["']\[data-program-storefront\]["']\s*\)/,
    "Storefront must query its mount marker",
  );
  assert.match(storefrontRenderer, /\binnerHTML\s*=/, "Storefront must render into its mount");
  assert.match(initialization, /\brenderProgramStorefront\s*\(\s*\)\s*;/, "Storefront renderer must be initialized");
  assert.match(initialization, /\brenderProductDetail\s*\(\s*\)\s*;/, "Product detail renderer must remain initialized");
});

test("storefront and related program cards expose exact purchase controls", () => {
  const shop = read("shop.js");
  const cardRenderer = extractNamedDeclaration(shop, "renderProgramCard");

  assert.match(cardRenderer, ADD_TO_CART_BUTTON, "Card renderer needs the exact add-to-cart label");
  assert.match(cardRenderer, BUY_PROGRAM_BUTTON, "Card renderer needs the exact buy label");
});

test("product detail hero uses the exact buy label", () => {
  const shop = read("shop.js");
  const hero = extractHtmlSection(shop, "product-detail-hero");

  assert.match(hero, BUY_PROGRAM_BUTTON, "Product hero needs the exact buy label");
});

test("product detail final CTA uses the exact buy label", () => {
  const shop = read("shop.js");
  const finalCta = extractHtmlSection(shop, "product-final-cta");

  assert.match(finalCta, BUY_PROGRAM_BUTTON, "Final CTA needs the exact buy label");
});

test("programs page exposes the storefront mount marker", () => {
  const programs = read("programs.html");
  const storefront = extractHtmlSection(programs, "program-shop");

  assert.match(storefront, /data-program-storefront/, "Programs page needs the storefront mount marker");
});

test("programs page contains no static program card articles", () => {
  const programs = read("programs.html");
  const storefront = extractHtmlSection(programs, "program-shop");

  assert.doesNotMatch(storefront, STATIC_PROGRAM_CARD, "Programs page still contains static program cards");
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
