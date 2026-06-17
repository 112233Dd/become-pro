const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const sectionIndex = (html, id) => html.indexOf(`id="${id}"`);
const sectionHtml = (html, id) => {
  const start = sectionIndex(html, id);
  if (start < 0) return "";
  const next = html.indexOf("<section", start + 8);
  return html.slice(start, next > start ? next : undefined);
};

test("summer program advertising route is separate from the product detail route", () => {
  const config = JSON.parse(read("vercel.json"));
  const rewrites = new Map(config.rewrites.map(({ source, destination }) => [source, destination]));

  assert.equal(rewrites.get("/summer-program"), "/summer-program.html");
  assert.equal(rewrites.get("/programs/summer-program"), "/programs/summer-program/index.html");
  assert.ok(fs.existsSync(path.join(root, "summer-program.html")));
});

test("summer program landing follows the approved shorter sales structure", () => {
  const html = read("summer-program.html");
  const approvedOrder = [
    "summer-hero",
    "summer-explainer",
    "summer-contents",
    "summer-price",
    "summer-training-proof",
    "summer-proof",
    "summer-preview",
    "summer-vision",
    "summer-coach",
    "summer-testimonials",
    "summer-faq",
    "summer-final-cta",
  ];

  let previous = -1;
  for (const id of approvedOrder) {
    const current = sectionIndex(html, id);
    assert.ok(current > previous, `${id} should appear after the previous approved section`);
    previous = current;
  }

  [
    "summer-problem",
    "summer-solution",
    "summer-benefits",
    "summer-fit",
    "summer-guarantee",
  ].forEach((id) => assert.equal(sectionIndex(html, id), -1, `${id} should not remain as a separate section`));

  assert.match(html, /data-summer-checkout/);
  assert.match(html, /data-mobile-sticky-cta/);
  assert.match(html, /0,50\s*€/);
  assert.doesNotMatch(html, /data-cart-count|site-nav|technical-pack|strength-level|matchday-pack/);
});

test("main price and trust block is immediately after the contents section", () => {
  const html = read("summer-program.html");
  const contents = sectionHtml(html, "summer-contents");
  const price = sectionHtml(html, "summer-price");

  assert.ok(sectionIndex(html, "summer-price") > sectionIndex(html, "summer-contents"));
  assert.ok(sectionIndex(html, "summer-training-proof") > sectionIndex(html, "summer-price"));
  assert.match(contents, /data-track-view="view_program_contents"/);
  assert.match(price, /data-track-view="view_price"/);
  assert.match(price, /Промо цена 0,50 €/);
  assert.match(price, /data-summer-checkout/);
  assert.match(price, /summer-price-trust-grid/);
  assert.equal((price.match(/<article>/g) || []).length, 3);

  [
    "Сигурно плащане чрез Stripe",
    "Моментален достъп",
    "Еднократно плащане",
  ].forEach((copy) => assert.match(price, new RegExp(copy)));
  assert.doesNotMatch(price, /<h3>Без абонамент<\/h3>/);
});

test("training videos stay after price and describe the online program proof", () => {
  const html = read("summer-program.html");
  const training = sectionHtml(html, "summer-training-proof");

  assert.ok(sectionIndex(html, "summer-training-proof") > sectionIndex(html, "summer-price"));
  assert.match(training, /id="summer-training-videos"/);
  assert.match(training, /data-track-view="view_training_videos"/);
  assert.match(training, /href="#summer-contents"/);
  assert.equal((training.match(/data-lazy-video/g) || []).length, 3);
  assert.equal((training.match(/preload="none"/g) || []).length, 3);

  [
    "field-drill-side-forward-back.mp4",
    "overlap-passing-cones.mp4",
    "change-direction-back.mp4",
    "field-drill-side-forward-back-poster.jpg",
    "overlap-passing-cones-poster.jpg",
    "change-direction-back-poster.jpg",
  ].forEach((asset) => assert.match(training, new RegExp(asset)));

  assert.doesNotMatch(training, /Виж как работим на терена|Реални тренировки/);
});

test("player proof remains authoritative and compact-ready for mobile", () => {
  const html = read("summer-program.html");
  const css = read("summer-program.css");
  const proof = sectionHtml(html, "summer-proof");

  assert.match(proof, /summer-player-proof-section/);
  assert.equal((proof.match(/class="summer-player-card summer-player-profile-card"/g) || []).length, 3);
  assert.equal((proof.match(/class="summer-player-photo/g) || []).length, 3);
  assert.match(proof, /summer-player-photo-iren/);
  assert.equal((proof.match(/class="summer-player-detail-block summer-player-profile-facts"/g) || []).length, 3);
  assert.equal((proof.match(/class="summer-player-detail-block summer-player-achievements"/g) || []).length, 3);

  [
    "miroslav-marinov.jfif",
    "iren-georgieva.jfif",
    "panayot-paskov.jpg",
  ].forEach((asset) => assert.match(proof, new RegExp(asset)));

  assert.match(css, /summer-player-proof-section/);
  assert.match(css, /summer-player-proof-section \.summer-player-card/);
  assert.match(css, /summer-player-proof-section \.summer-player-photo/);
});

test("product preview, vision, coach, reviews, faq, and final CTA remain in the lower proof flow", () => {
  const html = read("summer-program.html");
  const ids = [
    "summer-preview",
    "summer-vision",
    "summer-coach",
    "summer-testimonials",
    "summer-faq",
    "summer-final-cta",
  ];

  ids.forEach((id) => assert.ok(sectionIndex(html, id) > sectionIndex(html, "summer-proof"), `${id} is in lower flow`));
  assert.match(html, /program-structure.webp/);
  assert.match(html, /weekly-plan.webp/);
  assert.match(html, /fitness-levels.webp/);
  assert.match(html, /training-library.webp/);
  assert.match(html, /coach-yordan-zhelev\.png/);
  assert.match(sectionHtml(html, "summer-final-cta"), /data-summer-checkout/);
  assert.match(sectionHtml(html, "summer-vision"), /След 4 седмици така може да изглежда и твоят напредък\./);
  assert.doesNotMatch(sectionHtml(html, "summer-vision"), /След 8 седмици така може да изглежда и твоят напредък\./);
});

test("strategic purchase CTAs all use the summer checkout handler", () => {
  const html = read("summer-program.html");

  assert.ok((html.match(/data-summer-checkout/g) || []).length >= 8);
  assert.ok((html.match(/data-primary-cta/g) || []).length >= 8);
  assert.match(html, /data-mobile-sticky-cta[\s\S]*Вземи програмата - 0,50 €/);
  assert.match(sectionHtml(html, "summer-training-proof"), /href="#summer-contents"/);
  assert.match(sectionHtml(html, "summer-price"), /Купи сега · Промо цена 0,50 €/);
});

test("summer program landing has isolated premium responsive styling", () => {
  const html = read("summer-program.html");
  const css = read("summer-program.css");

  assert.match(html, /summer-program\.css\?v=reorder-20260616/);
  assert.match(css, /#050505/);
  assert.match(css, /#f5c400|245,\s*196,\s*0/);
  assert.match(css, /\.summer-price-trust-section/);
  assert.match(css, /\.summer-price-trust-grid/);
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
    "view_program_contents",
    "view_price",
    "view_product_preview",
    "view_coach",
    "view_testimonials",
    "view_explainer_video",
    "view_training_videos",
    "play_explainer_video",
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
  assert.match(script, /data-lazy-video/);
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
  assert.match(script, /data-mobile-sticky-cta/);
  assert.match(script, /is-visible/);
  assert.match(script, /scrollY\s*>\s*80/);
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
    "view_program_contents",
    "view_price",
    "view_product_preview",
    "view_coach",
    "view_testimonials",
    "view_explainer_video",
    "view_training_videos",
    "play_explainer_video",
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

  [
    "checkoutStarted",
    "checkoutStarts",
    "checkoutCreated",
    "checkoutsCreated",
    "purchaseCompleted",
    "purchases",
    "purchaseConversionRate",
    "checkoutConversionRate",
  ].forEach((field) => {
    assert.match(endpoint, new RegExp(field));
    assert.match(script, new RegExp(field));
  });
  ["checkoutStarts", "purchases", "purchaseConversionRate"].forEach((field) => {
    assert.match(funnelRenderer, new RegExp(field));
  });
  assert.match(html, /Summer Program Dashboard/);
  assert.match(html, /Revenue/);
  assert.match(html, /Orders Count/);
  assert.match(html, /data-summer-funnel/);
  assert.match(html, /data-summer-orders-table/);
  assert.match(html, /Checkout Starts/);
  assert.match(html, /Purchases/);
  assert.match(html, /Purchase Conversion/);
});

test("Vercel Hobby deployment remains within the function limit", () => {
  const functionFiles = fs
    .readdirSync(path.join(root, "api"), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js") && entry.name !== "_shared.js");

  assert.ok(functionFiles.length <= 12, `Expected at most 12 functions, found ${functionFiles.length}`);
});
