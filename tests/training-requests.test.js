const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("training request page contains only the compact individual-training fields", () => {
  const html = read("contact.html");
  const form = html.match(/<form\b[\s\S]*?<\/form>/i)?.[0] || "";

  assert.match(html, /Запиши се за индивидуални тренировки/);
  assert.match(
    html,
    /Попълни кратката форма и ще се свържем с теб до 24 часа, за да уточним удобен ден, час и локация\./,
  );
  assert.match(form, /name="applicant_type"/);
  assert.match(form, /name="name"/);
  assert.match(form, /name="city"/);
  assert.match(form, /name="phone"/);
  assert.match(form, />Моето дете</);
  assert.match(form, />Себе си</);
  assert.match(form, />Запази място</);
  assert.match(
    form,
    /Данните се използват единствено за връзка относно индивидуалните тренировки\./,
  );

  [
    "request_type",
    "selected_program",
    'name="email"',
    "player_name",
    "player_age",
    "position",
    "goal",
    "preferred_time",
  ].forEach((removedField) => assert.doesNotMatch(form, new RegExp(removedField)));
});

test("training request frontend submits to the protected server workflow", () => {
  const script = read("script.js");

  assert.match(script, /fetch\(\s*["']\/api\/training-requests["']/);
  assert.match(script, /applicantType:\s*formData\.get\(["']applicant_type["']\)/);
  assert.match(
    script,
    /Благодаря ви! Отговорите са изпратени успешно\. Ще се свържем с вас възможно най-скоро\./,
  );
  assert.doesNotMatch(script, /\.from\(["']training_requests["']\)\.insert/);
});

test("public training request API validates, stores, and emails the request", () => {
  const endpoint = read("api/training-requests.js");

  assert.match(endpoint, /applicantType/);
  assert.match(endpoint, /Моето дете/);
  assert.match(endpoint, /Себе си/);
  assert.match(endpoint, /training_requests/);
  assert.match(endpoint, /status:\s*"new"/);
  assert.match(endpoint, /sendEmail/);
  assert.match(endpoint, /ADMIN_EMAIL/);
});

test("admin training request API is protected and supports status updates", () => {
  const endpoint = read("api/admin/training-requests.js");

  assert.match(endpoint, /verifyAdminToken/);
  assert.match(endpoint, /req\.method === "GET"/);
  assert.match(endpoint, /req\.method === "PATCH"/);
  assert.match(endpoint, /training_requests/);
  assert.match(endpoint, /contacted/);
  assert.match(endpoint, /booked/);
  assert.match(endpoint, /declined/);
});

test("admin panel includes a separate training requests dashboard", () => {
  const html = read("admin-orders.html");
  const script = read("admin-orders.js");

  assert.match(html, /Заявки за индивидуални тренировки/);
  assert.match(html, /data-training-requests/);
  assert.match(html, /data-training-request-table/);
  assert.match(html, /data-training-request-search/);
  assert.match(html, /data-training-request-status-filter/);
  assert.match(script, /\/api\/admin\/training-requests/);
  assert.match(script, /data-training-request-status/);
  assert.match(script, /method:\s*"PATCH"/);
  assert.match(script, /Нова/);
  assert.match(script, /Свързан/);
  assert.match(script, /Записан/);
  assert.match(script, /Отказан/);
});

test("Supabase schema defines the compact request model and allowed statuses", () => {
  const schema = read("supabase/schema.sql");

  assert.match(schema, /applicant_type text/);
  assert.match(schema, /status text/);
  assert.match(schema, /'new'/);
  assert.match(schema, /'contacted'/);
  assert.match(schema, /'booked'/);
  assert.match(schema, /'declined'/);
});

test("online program purchase controls do not use the training form", () => {
  const shop = read("shop.js");
  const checkoutStart = shop.match(/const startStripeCheckout[\s\S]*?(?=\nconst |\nfunction |$)/)?.[0] || "";

  assert.match(checkoutStart, /\/api\/create-checkout-session/);
  assert.doesNotMatch(checkoutStart, /contact\.html|training-requests|анкета/i);
});
