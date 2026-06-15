const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("summer program advertising route is separate from the product detail route", () => {
  const config = JSON.parse(read("vercel.json"));
  const rewrites = new Map(config.rewrites.map(({ source, destination }) => [source, destination]));

  assert.equal(rewrites.get("/summer-program"), "/summer-program.html");
  assert.equal(rewrites.get("/programs/summer-program"), "/programs/summer-program/index.html");
  assert.ok(fs.existsSync(path.join(root, "summer-program.html")));
});

test("summer program landing contains only the approved conversion structure", () => {
  const html = read("summer-program.html");

  [
    'id="summer-hero"',
    'id="summer-problem"',
    'id="summer-solution"',
    'id="summer-benefits"',
    'id="summer-contents"',
    'id="summer-fit"',
    'id="summer-proof"',
    'id="summer-price"',
    'id="summer-guarantee"',
    'id="summer-faq"',
    'id="summer-final-cta"',
  ].forEach((marker) => assert.match(html, new RegExp(marker)));

  assert.match(html, /data-summer-checkout/);
  assert.match(html, /data-mobile-sticky-cta/);
  assert.match(html, /0,50\s*€/);
  assert.doesNotMatch(html, /data-cart-count|site-nav|Други програми|Свързани програми/);
  assert.doesNotMatch(html, /technical-pack|strength-level|matchday-pack/);
});

test("summer program landing uses approved sales copy and trust content", () => {
  const html = read("summer-program.html");

  assert.match(html, /Технически тренировки/);
  assert.match(html, /Скорост и експлозивност/);
  assert.match(html, /Физическа подготовка/);
  assert.match(html, /Ясен план за действие/);
  assert.match(html, /50\+[\s\S]*футболисти/);
  assert.match(html, /100\+[\s\S]*проведени тренировки/);
  assert.match(html, /Сигурно плащане чрез Stripe/);
  assert.match(html, /Моментален достъп след покупка/);
  assert.match(html, /Без абонаменти и скрити такси/);
  assert.match(html, /Поддръжка при въпроси/);
  assert.match(html, /become\.pro2024@gmail\.com/);
  assert.match(html, /privacy-policy/);
  assert.match(html, /terms/);
  assert.match(html, /cookie-policy/);
  assert.match(html, /refund-policy/);
});

test("summer program landing has isolated premium responsive styling", () => {
  const html = read("summer-program.html");
  const css = read("summer-program.css");

  assert.match(html, /summer-program\.css/);
  assert.match(css, /#050505/);
  assert.match(css, /#f5c400|245,\s*196,\s*0/);
  assert.match(css, /\.summer-mobile-sticky/);
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(css, /overflow-x:\s*hidden/);
});

test("summer program tracker emits the approved anonymous commerce funnel", () => {
  const script = read("summer-program.js");

  [
    "page_view",
    "scroll_25",
    "scroll_50",
    "scroll_75",
    "scroll_90",
    "view_problem",
    "view_solution",
    "view_program_contents",
    "view_price",
    "click_primary_cta",
    "checkout_started",
    "checkout_created",
    "checkout_error",
  ].forEach((eventName) => assert.match(script, new RegExp(eventName)));

  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((field) => {
    assert.match(script, new RegExp(field));
  });

  assert.match(script, /pageVariant\s*=\s*"summer-program"/);
  assert.match(script, /sessionStorage/);
  assert.match(script, /crypto\.randomUUID/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /\/api\/landing-analytics/);
  assert.doesNotMatch(script, /analyticsPayload[\s\S]{0,900}\b(name|phone|email)\s*:/);
});

test("summer program CTA creates checkout only for the summer program", () => {
  const script = read("summer-program.js");

  assert.match(script, /\/api\/create-checkout-session/);
  assert.match(script, /items:\s*\["summer-program"\]/);
  assert.match(script, /checkout_started/);
  assert.match(script, /checkout_created/);
  assert.match(script, /checkout_error/);
  assert.match(script, /window\.location\.href\s*=\s*data\.url/);
});

test("checkout copies anonymous landing attribution into Stripe metadata", () => {
  const endpoint = read("api/create-checkout-session.js");
  const shared = read("api/_shared.js");

  [
    "landingSessionId",
    "landingPageUrl",
    "pageVariant",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "referrer",
    "deviceType",
  ].forEach((field) => assert.match(`${endpoint}\n${shared}`, new RegExp(field)));
  assert.match(shared, /landingSessionId:\s*attribution\.landingSessionId/);
  assert.match(shared, /body\.append\(`metadata\[\$\{key\}\]`/);
  assert.match(shared, /body\.append\(`payment_intent_data\[metadata\]\[\$\{key\}\]`/);
});

test("analytics API accepts summer funnel events but reserves purchases for the webhook", () => {
  const endpoint = read("api/landing-analytics.js");
  const publicEvents = endpoint.match(/const EVENT_NAMES[\s\S]*?\]\);/)?.[0] || "";

  [
    "scroll_25",
    "scroll_75",
    "view_problem",
    "view_solution",
    "view_program_contents",
    "view_price",
    "checkout_started",
    "checkout_created",
    "checkout_error",
  ].forEach((eventName) => assert.match(publicEvents, new RegExp(eventName)));

  assert.doesNotMatch(publicEvents, /purchase_completed/);
});

test("purchase completion is written only by the verified Stripe webhook", () => {
  const browser = read("summer-program.js");
  const analyticsApi = read("api/landing-analytics.js");
  const webhook = read("api/stripe/webhook.js");
  const schema = read("supabase/schema.sql");

  assert.doesNotMatch(browser, /track\(["']purchase_completed/);
  assert.doesNotMatch(analyticsApi.match(/const EVENT_NAMES[\s\S]*?\]\);/)?.[0] || "", /purchase_completed/);
  assert.match(webhook, /purchase_completed/);
  assert.match(webhook, /landing_analytics_events/);
  assert.match(webhook, /checkout\.session\.completed/);
  assert.match(schema, /stripe_checkout_session_id/);
  assert.match(schema, /program_id/);
  assert.match(schema, /landing_analytics_purchase_session_idx/);
});

test("admin analytics exposes checkout and purchase metrics", () => {
  const endpoint = read("api/admin/landing-analytics.js");
  const html = read("admin-orders.html");
  const script = read("admin-orders.js");
  const funnelRenderer = script.match(/const analyticsFunnelRows[\s\S]*?\.join\(""\);/)?.[0] || "";

  ["checkoutStarts", "checkoutsCreated", "purchases", "purchaseConversionRate"].forEach((field) => {
    assert.match(endpoint, new RegExp(field));
    assert.match(script, new RegExp(field));
  });
  ["checkoutStarts", "purchases", "purchaseConversionRate"].forEach((field) => {
    assert.match(funnelRenderer, new RegExp(field));
  });
  assert.match(html, /Checkout Starts/);
  assert.match(html, /Purchases/);
  assert.match(html, /Purchase Conversion/);
  assert.equal((html.match(/<th>Checkout Starts<\/th>/g) || []).length, 3);
  assert.equal((html.match(/<th>Purchases<\/th>/g) || []).length, 3);
  assert.equal((html.match(/<th>Purchase Conversion<\/th>/g) || []).length, 3);
});

test("Vercel Hobby deployment remains within the function limit", () => {
  const functionFiles = fs
    .readdirSync(path.join(root, "api"), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js") && entry.name !== "_shared.js");

  assert.ok(functionFiles.length <= 12, `Expected at most 12 functions, found ${functionFiles.length}`);
});
