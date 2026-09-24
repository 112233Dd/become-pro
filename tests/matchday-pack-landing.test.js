const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("matchday pack has a dedicated clean landing route", () => {
  const config = JSON.parse(read("vercel.json"));
  const rewrites = new Map(config.rewrites.map(({ source, destination }) => [source, destination]));

  assert.equal(rewrites.get("/matchday-pack"), "/matchday-pack.html");
  assert.ok(fs.existsSync(path.join(root, "matchday-pack.html")));
});

test("matchday landing follows the complete conversion flow", () => {
  const html = read("matchday-pack.html");
  const orderedSections = [
    "matchday-hero",
    "matchday-problem",
    "matchday-timeline",
    "matchday-contents",
    "matchday-price",
    "matchday-field-proof",
    "matchday-coach",
    "matchday-faq",
    "matchday-final",
  ];
  let lastIndex = -1;

  orderedSections.forEach((id) => {
    const index = html.indexOf(`id="${id}"`);
    assert.ok(index > lastIndex, `${id} must appear in the approved order`);
    lastIndex = index;
  });

  assert.match(html, /24\.99\s*€/);
  assert.ok((html.match(/data-matchday-checkout/g) || []).length >= 5);
  assert.match(html, /data-mobile-sticky-cta/);
  assert.match(html, /program-cover-matchday\.webp/);
});

test("matchday checkout purchases only the real matchday product", () => {
  const script = read("matchday-pack.js");

  assert.match(script, /\/api\/create-checkout-session/);
  assert.match(script, /items:\s*\["matchday-pack"\]/);
  assert.match(script, /pageVariant\s*=\s*"matchday-pack"/);
  assert.match(script, /checkout_started/);
  assert.match(script, /checkout_created/);
  assert.match(script, /checkout_error/);
});

test("matchday landing uses isolated responsive styling", () => {
  const html = read("matchday-pack.html");
  const css = read("matchday-pack.css");

  assert.match(html, /matchday-pack\.min\.css/);
  assert.match(css, /\.matchday-timeline/);
  assert.match(css, /\.matchday-mobile-sticky/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("storefront sends Matchday Pack visitors to its sales landing", () => {
  const shop = read("shop.js");
  assert.match(shop, /program\.id === "matchday-pack"[\s\S]*?return "\/matchday-pack"/);
});
