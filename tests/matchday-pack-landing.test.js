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
    "matchday-preview",
    "matchday-testimonials",
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
  assert.match(html, /data-matchday-nav-toggle/);
  ["/programs", "/individual-training", "/coach", "/players", "/faq", "/contact"].forEach((href) => {
    assert.match(html, new RegExp(`href="${href}"`));
  });
});

test("matchday landing shows real product previews and honest social proof before price", () => {
  const html = read("matchday-pack.html");
  const previewIndex = html.indexOf('id="matchday-preview"');
  const testimonialsIndex = html.indexOf('id="matchday-testimonials"');
  const priceIndex = html.indexOf('id="matchday-price"');

  assert.ok(previewIndex > html.indexOf('id="matchday-contents"'));
  assert.ok(testimonialsIndex > previewIndex);
  assert.ok(priceIndex > testimonialsIndex);
  assert.match(html, /assets\/matchday-pack-preview\/pre-match-routine\.webp/);
  assert.match(html, /assets\/matchday-pack-preview\/hydration-plan\.webp/);
  assert.match(html, /assets\/matchday-pack-preview\/post-match-recovery\.webp/);
  assert.equal((html.match(/class="matchday-preview-card"/g) || []).length, 3);
  assert.equal((html.match(/data-matchday-preview-index=/g) || []).length, 3);
  assert.match(html, /27 страници/);
  assert.match(html, /3<\/strong> основни етапа/);
  assert.match(html, /Отзиви от работата с Become Pro/);
  assert.doesNotMatch(html, /Вземи системата на Йордан/);
});

test("matchday content matches the real PDF structure", () => {
  const html = read("matchday-pack.html");

  assert.match(html, /Практична система, която подрежда всичко важно около мача — от деня преди него до възстановяването след последния съдийски сигнал\./);
  assert.doesNotMatch(html, /преди, по време и след мач/);
  assert.match(html, /Трите основни етапа в материала са разгърнати в четири практични момента/);
  assert.match(html, /МАЧОВИЯТ ДЕН/);
  assert.doesNotMatch(html, />СУТРИНТА</);
});

test("matchday product previews open in an accessible lightbox", () => {
  const html = read("matchday-pack.html");
  const script = read("matchday-pack.js");
  const css = read("matchday-pack.css");

  assert.match(html, /<dialog class="matchday-lightbox"[^>]+data-matchday-lightbox/);
  assert.match(html, /data-matchday-lightbox-close[^>]+aria-label="Затвори прегледа"/);
  assert.match(html, /data-matchday-lightbox-prev[^>]+aria-label="Предишна страница"/);
  assert.match(html, /data-matchday-lightbox-next[^>]+aria-label="Следваща страница"/);
  assert.match(script, /showModal\(\)/);
  assert.match(script, /event\.key === "ArrowLeft"/);
  assert.match(script, /event\.key === "ArrowRight"/);
  assert.match(script, /addEventListener\("cancel"/);
  assert.match(css, /\.matchday-lightbox::backdrop/);
  assert.match(css, /height:\s*100dvh/);
});

test("matchday field proof uses a clean real training clip", () => {
  const html = read("matchday-pack.html");

  assert.match(html, /individual-tech-first-touch-poster\.webp/);
  assert.match(html, /individual-tech-first-touch\.mp4/);
  assert.doesNotMatch(html, /individual-decisions-game-situations/);
});

test("matchday checkout purchases only the real matchday product", () => {
  const script = read("matchday-pack.js");
  const shared = read("api/_shared.js");
  const webhook = read("api/stripe/webhook.js");

  assert.match(script, /\/api\/create-checkout-session/);
  assert.match(script, /items:\s*\["matchday-pack"\]/);
  assert.match(script, /pageVariant\s*=\s*"matchday-pack"/);
  assert.match(script, /checkout_started/);
  assert.match(script, /checkout_created/);
  assert.match(script, /checkout_error/);
  assert.match(script, /data-matchday-nav-toggle/);
  assert.match(script, /aria-expanded/);
  assert.match(shared, /"matchday-pack":\s*"https:\/\/drive\.google\.com\/file\/d\/[^\"]+\/view\?usp=sharing"/);
  assert.match(shared, /programLink:\s*PROGRAM_LINKS\["matchday-pack"\]/);
  assert.match(webhook, /sendFulfillmentEmails/);
  assert.match(webhook, /program\.programLink/);
});

test("matchday landing uses isolated responsive styling", () => {
  const html = read("matchday-pack.html");
  const css = read("matchday-pack.css");

  assert.match(html, /matchday-pack\.min\.css/);
  assert.match(css, /\.matchday-timeline/);
  assert.match(css, /\.matchday-mobile-sticky/);
  assert.match(css, /\.matchday-preview-grid/);
  assert.match(css, /\.matchday-testimonial-grid/);
  assert.match(css, /\.matchday-faq summary[\s\S]*font-size:\s*17px/);
  assert.match(css, /\.matchday-video-grid p[\s\S]*font-size:\s*15px/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.matchday-preview-grid[\s\S]*overflow-x: auto/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.matchday-testimonial-grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("storefront sends Matchday Pack visitors to its sales landing", () => {
  const shop = read("shop.js");
  assert.match(shop, /program\.id === "matchday-pack"[\s\S]*?return "\/matchday-pack"/);
});
