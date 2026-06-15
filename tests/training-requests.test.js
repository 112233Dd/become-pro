const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("contact page is a general contact form, not a training request form", () => {
  const html = read("contact.html");
  const form = html.match(/<form\b[\s\S]*?<\/form>/i)?.[0] || "";

  assert.match(html, /Пиши ни за въпрос, програма или индивидуална тренировка/);
  assert.match(
    html,
    /Използвай тази страница, ако имаш въпрос, нужда от насока или искаш да разбереш кой вариант е най-подходящ за теб\./,
  );
  assert.match(form, /name="name"/);
  assert.match(form, /name="phone"/);
  assert.match(form, /name="email"/);
  assert.match(form, /name="message"/);
  assert.match(form, />Изпрати съобщението</);
  assert.match(
    form,
    /С изпращането на формата се съгласявам данните ми да бъдат използвани единствено за връзка по моето запитване\./,
  );
  assert.doesNotMatch(form, /name="applicant_type"/);
  assert.doesNotMatch(form, /name="city"/);
  assert.doesNotMatch(form, /Моето дете|Себе си|Запази място|Запази тренировка/);
});

test("general contact frontend submits through the shared requests endpoint", () => {
  const script = read("script.js");

  assert.match(script, /\/api\/training-requests/);
  assert.match(script, /requestType:\s*"contact"/);
  assert.match(script, /name:\s*formData\.get\(["']name["']\)/);
  assert.match(script, /email:\s*formData\.get\(["']email["']\)/);
  assert.match(script, /message:\s*formData\.get\(["']message["']\)/);
  assert.match(
    script,
    /Благодарим ти! Съобщението е изпратено успешно\. Ще се свържем с теб възможно най-скоро\./,
  );
});

test("training signup CTAs point to the dedicated training landing page", () => {
  ["index.html", "coach.html", "players.html", "programs.html", "faq.html", "contact.html"].forEach((page) => {
    const html = read(page);
    assert.doesNotMatch(html, /href="contact\.html">(?:Запази|Запиши|Започни)/);
  });
});

test("public contact inquiry API validates, stores, and emails the inquiry", () => {
  const endpoint = read("api/training-requests.js");

  assert.match(endpoint, /requestType === "contact"/);
  assert.match(endpoint, /contact_inquiries/);
  assert.match(endpoint, /name/);
  assert.match(endpoint, /phone/);
  assert.match(endpoint, /email/);
  assert.match(endpoint, /message/);
  assert.match(endpoint, /status:\s*"new"/);
  assert.match(endpoint, /sendEmail/);
});

test("training request API remains dedicated to individual training signups", () => {
  const endpoint = read("api/training-requests.js");

  assert.match(endpoint, /applicantType/);
  assert.match(endpoint, /Моето дете/);
  assert.match(endpoint, /Себе си/);
  assert.match(endpoint, /training_requests/);
  assert.match(endpoint, /status:\s*"new"/);
  assert.match(endpoint, /sendEmail/);
});

test("admin contact inquiry API is protected and supports status updates", () => {
  const endpoint = read("api/admin/training-requests.js");

  assert.match(endpoint, /verifyAdminToken/);
  assert.match(endpoint, /searchParams\.get\("type"\) === "contact"/);
  assert.match(endpoint, /req\.method === "GET"/);
  assert.match(endpoint, /req\.method === "PATCH"/);
  assert.match(endpoint, /contact_inquiries/);
  assert.match(endpoint, /answered/);
  assert.match(endpoint, /archived/);
});

test("admin panel includes a separate contact inquiries dashboard", () => {
  const html = read("admin-orders.html");
  const script = read("admin-orders.js");

  assert.match(html, /Контактни запитвания/);
  assert.match(html, /data-contact-inquiries/);
  assert.match(html, /data-contact-inquiry-table/);
  assert.match(html, /data-contact-inquiry-search/);
  assert.match(html, /data-contact-inquiry-status-filter/);
  assert.match(script, /\/api\/admin\/training-requests\?type=contact/);
  assert.match(script, /data-contact-inquiry-status/);
  assert.match(script, /method:\s*"PATCH"/);
  assert.match(script, /Ново/);
  assert.match(script, /Отговорено/);
  assert.match(script, /Архивирано/);
});

test("Vercel Hobby deployment stays within the 12 function limit", () => {
  const functionFiles = fs
    .readdirSync(path.join(root, "api"), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js") && entry.name !== "_shared.js");

  assert.ok(functionFiles.length <= 12, `Expected at most 12 functions, found ${functionFiles.length}`);
});

test("Supabase schema defines contact inquiries and allowed statuses", () => {
  const schema = read("supabase/schema.sql");

  assert.match(schema, /create table if not exists public\.contact_inquiries/);
  assert.match(schema, /name text not null/);
  assert.match(schema, /phone text not null/);
  assert.match(schema, /email text not null/);
  assert.match(schema, /message text not null/);
  assert.match(schema, /'new'/);
  assert.match(schema, /'answered'/);
  assert.match(schema, /'archived'/);
});

test("online program purchase controls do not use the training form", () => {
  const shop = read("shop.js");
  const checkoutStart = shop.match(/const startStripeCheckout[\s\S]*?(?=\nconst |\nfunction |$)/)?.[0] || "";

  assert.match(checkoutStart, /\/api\/create-checkout-session/);
  assert.doesNotMatch(checkoutStart, /contact\.html|training-requests|анкета/i);
});
