const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const productPages = [
  ["technical-pack", "technical-pack"],
  ["strength-level-1", "strength-level-1"],
  ["strength-level-2", "strength-level-2"],
  ["strength-level-3", "strength-level-3"],
  ["summer-program", "summer-program"],
  ["matchday-pack", "matchday-pack"],
];

test("all product pages mount the shared detail content and required scripts", () => {
  productPages.forEach(([folder, programId]) => {
    const html = read(`programs/${folder}/index.html`);

    assert.match(html, new RegExp(`data-product-detail[^>]*data-program-id="${programId}"`));
    assert.match(html, /<script src="\.\.\/\.\.\/shop\.js"><\/script>/);
    assert.match(html, /<link rel="stylesheet" href="\.\.\/\.\.\/styles\.css"\s*\/>/);
    assert.match(html, /data-cart-count/);
  });
});

test("homepage hero shows the four approved launch statistics", () => {
  const html = read("index.html");

  assert.match(html, /<strong>50\+<\/strong><span>футболисти<\/span>/);
  assert.match(html, /<strong>100\+<\/strong><span>проведени тренировки<\/span>/);
  assert.match(html, /<strong>4\+<\/strong><span>футболни програми<\/span>/);
  assert.match(html, /<strong>10[–-]24<\/strong><span>години подходяща възраст<\/span>/);
});

test("program storefront and product details include purchase trust", () => {
  const programs = read("programs.html");
  const shop = read("shop.js");

  assert.match(programs, /data-program-storefront[\s\S]*data-purchase-trust/);
  assert.match(shop, /Сигурно плащане чрез Stripe/);
  assert.match(shop, /Моментален достъп след успешна покупка/);
  assert.match(shop, /Получаваш програмата директно на имейл/);
  assert.match(shop, /Поддръжка при проблем с достъпа/);
  assert.match(shop, /renderPurchaseTrust/);
});

test("every public page uses the shared footer", () => {
  const pages = [
    "index.html",
    "programs.html",
    "cart.html",
    "checkout.html",
    "coach.html",
    "contact.html",
    "faq.html",
    "players.html",
    "privacy-policy.html",
    "terms.html",
    "cookie-policy.html",
    "refund-policy.html",
    ...productPages.map(([folder]) => `programs/${folder}/index.html`),
  ];

  pages.forEach((page) => {
    const html = read(page);
    assert.equal((html.match(/data-site-footer/g) || []).length, 1, `${page} needs one footer mount`);
    assert.match(html, /script\.js/);
  });

  const script = read("script.js");
  assert.match(script, /https:\/\/www\.instagram\.com\//);
  assert.match(script, /https:\/\/www\.tiktok\.com\//);
  assert.match(script, /mailto:become\.pro2024@gmail\.com/);
  assert.match(script, /tel:\+359897575257/);
  assert.match(script, /\/privacy-policy/);
  assert.match(script, /\/terms/);
  assert.match(script, /\/cookie-policy/);
  assert.match(script, /\/refund-policy/);
});

test("legal pages and clean routes expose the required policies", () => {
  const legalPages = new Map([
    ["privacy-policy.html", "Политика за поверителност"],
    ["terms.html", "Общи условия"],
    ["cookie-policy.html", "Политика за бисквитки"],
    ["refund-policy.html", "Политика за възстановяване на суми"],
  ]);

  legalPages.forEach((heading, page) => {
    const html = read(page);
    assert.match(html, new RegExp(`<h1>${heading}</h1>`));
    assert.match(html, /Последна актуализация: 14 юни 2026 г\./);
    assert.match(html, /become\.pro2024@gmail\.com/);
    assert.match(html, /data-header/);
    assert.match(html, /data-site-footer/);
  });

  const config = JSON.parse(read("vercel.json"));
  const rewrites = new Map(config.rewrites.map(({ source, destination }) => [source, destination]));

  assert.equal(rewrites.get("/privacy-policy"), "/privacy-policy.html");
  assert.equal(rewrites.get("/terms"), "/terms.html");
  assert.equal(rewrites.get("/cookie-policy"), "/cookie-policy.html");
  assert.equal(rewrites.get("/refund-policy"), "/refund-policy.html");
});

test("mobile layout keeps stats compact and stacks footer and trust content", () => {
  const styles = read("styles.css");

  assert.match(styles, /@media \(max-width: 1060px\)[\s\S]*?\.hero-stats,[\s\S]*?\.purchase-trust[\s\S]*?grid-template-columns: repeat\(2,/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.footer-main,[\s\S]*?\.purchase-trust[\s\S]*?grid-template-columns: 1fr/);
});

test("cart exposes quantity, remove, total, and Stripe checkout controls", () => {
  const shop = read("shop.js");

  assert.match(shop, /Количество:\s*1/);
  assert.match(shop, /data-shop-remove/);
  assert.match(shop, /cart-summary-total/);
  assert.match(shop, /Продължи към плащане/);
  assert.match(shop, /\/api\/create-checkout-session/);
});

test("checkout can be disabled while payment configuration is under review", () => {
  const endpoint = read("api/create-checkout-session.js");
  const shared = read("api/_shared.js");

  assert.match(shared, /isCheckoutEnabled/);
  assert.match(endpoint, /isCheckoutEnabled/);
  assert.match(endpoint, /return sendJson\(res,\s*503/);
});

test("checkout still tolerates pending-order persistence failures when enabled", () => {
  const endpoint = read("api/create-checkout-session.js");

  assert.match(endpoint, /try\s*{\s*await upsertOrders\(/);
  assert.match(endpoint, /catch\s*\(persistenceError\)/);
  assert.match(endpoint, /console\.error\(\s*"Pending order persistence failed:"/);
  assert.match(endpoint, /return sendJson\(res,\s*200,\s*{\s*url:\s*session\.url/);
});

test("paid-order persistence failure does not block fulfillment email", () => {
  const webhook = read("api/stripe/webhook.js");
  const completedBlock =
    webhook.match(/if \(event\.type === "checkout\.session\.completed"\) \{[\s\S]*?\n    \}/)?.[0] || "";

  assert.match(completedBlock, /catch\s*\(persistenceError\)/);
  assert.match(completedBlock, /console\.error\(\s*"Paid order persistence failed:"/);
  assert.match(completedBlock, /markDeliveryFailed/);
  assert.match(completedBlock, /await sendFulfillmentEmails/);
});

test("admin orders fall back to Stripe when the Supabase table is unavailable", () => {
  const endpoint = read("api/admin/orders.js");

  assert.match(endpoint, /try\s*{\s*const orders = await supabaseRequest/);
  assert.match(endpoint, /catch\s*\(supabaseError\)/);
  assert.match(endpoint, /console\.error\(\s*"Supabase orders unavailable:"/);
  assert.match(endpoint, /source:\s*"stripe-fallback"/);
});

test("contact form is only for individual training requests", () => {
  const html = read("contact.html");
  const form = html.match(/<form\b[\s\S]*?<\/form>/i)?.[0] || "";

  assert.match(html, /Запиши се за индивидуални тренировки/);
  assert.match(form, /name="applicant_type"/);
  assert.match(form, /name="name"/);
  assert.match(form, /name="city"/);
  assert.match(form, /name="phone"/);
  assert.doesNotMatch(form, /selected_program|request_type|name="email"|онлайн програма/i);
});

test("training requests support the legacy production schema until migration", () => {
  const publicEndpoint = read("api/training-requests.js");
  const adminEndpoint = read("api/admin/training-requests.js");

  assert.match(publicEndpoint, /isLegacyTrainingSchemaError/);
  assert.match(publicEndpoint, /request_type:\s*"training"/);
  assert.match(publicEndpoint, /catch\s*\(schemaError\)/);
  assert.match(adminEndpoint, /isLegacyTrainingSchemaError/);
  assert.match(adminEndpoint, /applicant_type:\s*request\.applicant_type\s*\|\|\s*request\.who/);
  assert.match(adminEndpoint, /status:\s*request\.status\s*\|\|\s*"new"/);
});

test("online-program FAQ describes automatic access after successful payment", () => {
  const html = read("faq.html");
  const extractSection = (id) => {
    const start = html.indexOf(`id="${id}"`);
    const end = html.indexOf("</section>", start);
    return html.slice(start, end);
  };
  const onlineFaq = ["faq-programs", "faq-access", "faq-payment"]
    .map(extractSection)
    .join("\n");
  const onlineProgramFaq = ["faq-programs", "faq-access"]
    .map((id) => {
      return extractSection(id);
    })
    .join("\n");

  assert.match(
    onlineFaq,
    /След успешно плащане получаваш автоматичен имейл с линк за достъп до програмата\./,
  );
  assert.doesNotMatch(onlineProgramFaq, /след заявка/i);
  assert.doesNotMatch(onlineProgramFaq, /уточняваме начина на плащане/i);
  assert.doesNotMatch(onlineProgramFaq, /изпрати запитване/i);
});

test("homepage has no Program plus 1:1 primary option and players have no placeholders", () => {
  assert.doesNotMatch(read("index.html"), /Програма\s*\+\s*1:1/i);
  assert.doesNotMatch(
    read("players.html"),
    /Профилът ще бъде допълнен|Информацията ще бъде добавена след потвърждение/i,
  );
});
