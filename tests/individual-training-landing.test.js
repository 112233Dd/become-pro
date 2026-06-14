const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const createRequest = (body, method = "POST") => {
  const req = Readable.from(body === undefined ? [] : [JSON.stringify(body)]);
  req.method = method;
  req.headers = {};
  req.query = {};
  return req;
};

const createResponse = () => ({
  statusCode: 0,
  headers: {},
  body: "",
  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  },
  end(value = "") {
    this.body = value;
  },
});

test("individual training campaign route and page exist", () => {
  const rewrites = new Map(JSON.parse(read("vercel.json")).rewrites.map((item) => [item.source, item.destination]));

  assert.equal(rewrites.get("/individual-training"), "/individual-training.html");
  assert.equal(rewrites.get("/training"), "/individual-training.html");
  assert.equal(rewrites.get("/training/plovdiv"), "/individual-training.html");
  assert.equal(rewrites.get("/training/sofia"), "/individual-training.html");
  assert.equal(rewrites.get("/training/stara-zagora"), "/individual-training.html");
  assert.equal(rewrites.get("/training/parents"), "/individual-training.html");
  assert.equal(rewrites.get("/training/players"), "/individual-training.html");
  assert.ok(fs.existsSync(path.join(root, "individual-training.html")));
});

test("landing page contains the approved conversion structure", () => {
  const html = read("individual-training.html");

  assert.match(html, /Индивидуални футболни тренировки за играчи, които искат реален прогрес/);
  assert.match(
    html,
    /Персонална работа върху техника, първо докосване, дрибъл, скорост, завършване и увереност с топката/,
  );
  assert.match(html, /data-page-variant="general"/);
  assert.match(html, /data-primary-cta/);
  assert.match(html, /data-secondary-cta/);
  assert.match(html, /id="training-fit"/);
  assert.match(html, /id="player-benefits"/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /id="player-results"/);
  assert.match(html, /id="training-video"/);
  assert.match(html, /id="training-faq"/);
  assert.match(html, /id="training-form"/);
  assert.match(html, /data-mobile-sticky-cta/);
  assert.match(html, /individual-training\.css/);
  assert.match(html, /individual-training\.js/);
});

test("landing form contains only the compact approved fields and success message", () => {
  const html = read("individual-training.html");
  const form = html.match(/<form\b[\s\S]*?<\/form>/i)?.[0] || "";

  ["applicant_type", "name", "city", "phone"].forEach((name) => {
    assert.match(form, new RegExp(`name="${name}"`));
  });
  assert.doesNotMatch(form, /name="email"|player_age|position|goal/);
  assert.match(form, /Моето дете/);
  assert.match(form, /Себе си/);
  assert.match(form, /Запази тренировка/);
  assert.match(
    html,
    /Благодаря ви! Заявката е изпратена успешно\. Ще се свържем с вас възможно най-скоро\./,
  );
});

test("landing page uses real training media, player proof, FAQ, and compact legal footer", () => {
  const html = read("individual-training.html");

  assert.match(html, /assets\/videos\/hero-hat-swap-game\.mp4/);
  assert.match(html, /Виж как изглежда една индивидуална тренировка/);
  assert.match(html, /За каква възраст са тренировките\?/);
  assert.match(html, /Къде се провеждат\?/);
  assert.match(html, /Колко продължава една тренировка\?/);
  assert.match(html, /Може ли родителят да присъства\?/);
  assert.match(html, /Подходящи ли са, ако играчът вече тренира в клуб\?/);
  assert.match(html, /privacy-policy/);
  assert.match(html, /cookie-policy/);
  assert.match(html, /terms/);
});

test("landing tracker emits only approved anonymous funnel events", () => {
  const script = read("individual-training.js");

  [
    "page_view",
    "scroll_50",
    "scroll_90",
    "click_primary_cta",
    "click_secondary_cta",
    "form_start",
    "form_submit_success",
    "form_submit_error",
  ].forEach((eventName) => assert.match(script, new RegExp(eventName)));

  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((field) => {
    assert.match(script, new RegExp(field));
  });

  assert.match(script, /sessionStorage/);
  assert.match(script, /crypto\.randomUUID/);
  assert.match(script, /navigator\.sendBeacon/);
  assert.match(script, /keepalive:\s*true/);
  assert.match(script, /\/api\/landing-analytics/);
  assert.match(script, /\/api\/training-requests/);
  assert.match(script, /landingPageUrl/);
  assert.match(script, /pageVariant/);
  assert.match(script, /VARIANT_BY_PATH/);
  assert.match(script, /\/training\/plovdiv/);
  assert.match(script, /CITY_BY_VARIANT/);
  assert.match(script, /deviceType/);
  assert.match(script, /browser/);
  assert.doesNotMatch(script, /analyticsPayload\s*=\s*\{[\s\S]{0,900}\b(name|phone|email)\s*:/);
});

test("public landing analytics endpoint validates and stores anonymous events", () => {
  const endpoint = read("api/landing-analytics.js");

  [
    "page_view",
    "scroll_50",
    "scroll_90",
    "click_primary_cta",
    "click_secondary_cta",
    "form_start",
    "form_submit_success",
    "form_submit_error",
  ].forEach((eventName) => assert.match(endpoint, new RegExp(eventName)));

  assert.match(endpoint, /landing_analytics_events/);
  assert.match(endpoint, /Personal data is not accepted by analytics/);
  assert.match(endpoint, /\["name", "phone", "email"\]/);
  assert.match(endpoint, /session_id/);
  assert.match(endpoint, /event_name/);
  assert.doesNotMatch(endpoint, /x-forwarded-for|x-real-ip|ip_address/i);
});

test("landing analytics handler rejects personal data before database access", async () => {
  const handler = require(path.join(root, "api/landing-analytics.js"));
  const response = createResponse();

  await handler(
    createRequest({
      sessionId: "12345678-1234-1234-1234-123456789012",
      landingPageUrl: "https://example.com/individual-training",
      pageVariant: "general",
      eventName: "page_view",
      phone: "+359000000000",
    }),
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.match(response.body, /Personal data/);
});

test("landing analytics handler rejects unknown events before database access", async () => {
  const handler = require(path.join(root, "api/landing-analytics.js"));
  const response = createResponse();

  await handler(
    createRequest({
      sessionId: "12345678-1234-1234-1234-123456789012",
      landingPageUrl: "https://example.com/individual-training",
      pageVariant: "general",
      eventName: "identify_customer",
    }),
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.match(response.body, /Invalid analytics event/);
});

test("training requests persist optional campaign attribution", () => {
  const endpoint = read("api/training-requests.js");
  const adminEndpoint = read("api/admin/training-requests.js");

  [
    "landing_page_url",
    "page_variant",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "referrer",
    "device_type",
    "browser",
  ].forEach((field) => {
    assert.match(endpoint, new RegExp(field));
    assert.match(adminEndpoint, new RegExp(field));
  });
});

test("Supabase schema defines anonymous analytics, attribution, indexes, and 12 month retention", () => {
  const schema = read("supabase/schema.sql");
  const analyticsBlock =
    schema.match(/create table if not exists public\.landing_analytics_events[\s\S]*?alter table public\.landing_analytics_events enable row level security;/i)?.[0] ||
    "";

  assert.match(schema, /create table if not exists public\.landing_analytics_events/);
  assert.match(schema, /landing_page_url text/);
  assert.match(schema, /page_variant text/);
  assert.match(schema, /utm_source text/);
  assert.match(schema, /utm_medium text/);
  assert.match(schema, /utm_campaign text/);
  assert.match(schema, /event_name text/);
  assert.match(schema, /landing_analytics_event_time_idx/);
  assert.match(schema, /landing_analytics_variant_time_idx/);
  assert.match(schema, /landing_analytics_campaign_time_idx/);
  assert.match(schema, /landing_analytics_session_time_idx/);
  assert.match(schema, /landing_analytics_event_name_time_idx/);
  assert.match(schema, /delete_expired_landing_analytics/);
  assert.match(schema, /interval '12 months'/);
  assert.doesNotMatch(analyticsBlock, /ip_address|customer_name|phone|email/);
});

test("protected admin analytics API supports filters and funnel summaries", () => {
  const endpoint = read("api/admin/landing-analytics.js");

  assert.match(endpoint, /verifyAdminToken/);
  assert.match(endpoint, /landing_analytics_events/);
  assert.match(endpoint, /page_variant/);
  assert.match(endpoint, /utm_source/);
  assert.match(endpoint, /utm_medium/);
  assert.match(endpoint, /utm_campaign/);
  assert.match(endpoint, /pageViews/);
  assert.match(endpoint, /uniqueSessions/);
  assert.match(endpoint, /ctaClicks/);
  assert.match(endpoint, /formStarts/);
  assert.match(endpoint, /formSubmissions/);
  assert.match(endpoint, /conversionRate/);
  assert.match(endpoint, /byVariant/);
  assert.match(endpoint, /byCampaign/);
});

test("admin panel shows lead attribution and landing analytics", () => {
  const html = read("admin-orders.html");
  const script = read("admin-orders.js");

  assert.match(html, /Landing Page Analytics/);
  assert.match(html, /data-landing-analytics-filters/);
  assert.match(html, /data-landing-analytics-summary/);
  assert.match(html, /data-landing-variant-table/);
  assert.match(html, /data-landing-campaign-table/);
  assert.match(html, /Landing page/);
  assert.match(html, /Кампания/);
  assert.match(script, /\/api\/admin\/landing-analytics/);
  assert.match(script, /page_variant/);
  assert.match(script, /utm_campaign/);
  assert.match(script, /conversionRate/);
});

test("privacy pages disclose first-party cookieless analytics and retention", () => {
  const policies = `${read("privacy-policy.html")}\n${read("cookie-policy.html")}`;

  assert.match(policies, /first-party|първа страна/i);
  assert.match(policies, /без рекламни бисквитки/i);
  assert.match(policies, /анонимен идентификатор на сесия/i);
  assert.match(policies, /12 месеца/i);
  assert.match(policies, /IP адрес/i);
  assert.match(policies, /име, телефон|име и телефон/i);
});
