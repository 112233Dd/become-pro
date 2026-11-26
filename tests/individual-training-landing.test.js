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
  const config = JSON.parse(read("vercel.json"));
  const rewrites = new Map(config.rewrites.map((item) => [item.source, item.destination]));
  const redirects = new Map(config.redirects.map((item) => [item.source, item]));

  assert.equal(rewrites.get("/individual-training"), "/individual-training.html");
  ["/training", "/training/plovdiv", "/training/sofia", "/training/stara-zagora", "/training/parents", "/training/players"].forEach((route) => {
    assert.equal(redirects.get(route)?.destination, "/individual-training");
    assert.equal(redirects.get(route)?.permanent, true);
  });
  assert.ok(fs.existsSync(path.join(root, "individual-training.html")));
  assert.ok(fs.existsSync(path.join(root, "training", "index.html")));
  ["plovdiv", "sofia", "stara-zagora", "parents", "players"].forEach((variant) => {
    assert.ok(fs.existsSync(path.join(root, "training", variant, "index.html")));
  });
});

test("campaign keeps one concise journey and links each booking CTA to the form", () => {
  const html = read("individual-training.html");
  const sections = [...html.matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(sections, [
    "training-fit", "coach-proof", "training-video", "player-results", "how-it-works", "training-form", "training-faq",
  ]);
  assert.match(html, /data-cta-location="hero">Заяви безплатна тренировка/);
  assert.match(html, /href="#training-video" data-secondary-cta/);
  assert.match(html, /Виж как тренираме/);
  assert.match(html, /Свързваме се с теб до 24 часа/);
  assert.match(html, /0 €/);
  assert.match(html, /60–90 минути според възрастта и целите/);
  assert.match(html, /Упражнения, съобразени с нивото на играча/);
  assert.match(html, /Лична обратна връзка след тренировката/);
  assert.match(html, /Без предварително плащане · Уточняваме ден и час по телефона/);
  assert.match(html, /Индивидуални футболни тренировки за играчи от 7 до 24 години/);
  assert.doesNotMatch(html, /8 до 24 години|Потвърждение по телефона/);
  assert.match(html, /data-page-variant="individual-training"/);
  assert.match(html, /<style>[\s\S]*\.training-video-detail/);
  assert.match(html, /individual-training\.min\.js/);
  const buttons = [...html.matchAll(/<a [^>]*data-primary-cta[^>]*>/g)];
  assert.ok(buttons.length >= 4);
  for (const [button] of buttons) assert.match(button, /href="#training-form"/);
  assert.match(html, /data-mobile-sticky-cta/);
  assert.equal((html.match(/class="skill"/g) || []).length, 4);
  assert.match(html, /Не просто повтаряме упражнения/);
  assert.match(html, /Игра на скорост/);
  assert.doesNotMatch(html, /Дрибъл и скорост/);
  assert.match(html, /Какво споделят играчите и родителите/);
  assert.equal((html.match(/class="quote"/g) || []).length, 3);
  assert.match(html, /assets\/slavcho-ahmedov\.jpg/);
  assert.match(html, /assets\/albena-georgieva\.jpg/);
  assert.match(html, /assets\/ivan-trifonov\.jpg/);
  assert.match(html, /Славчо, 7 г\.[\s\S]*Стара Загора/);
  assert.match(html, /Албена, 16 г\.[\s\S]*София/);
  assert.match(html, /Иван, 17 г\.[\s\S]*Пловдив/);
  assert.match(html, /След тренировките започна да се чувства по-уверен с топката/);
  assert.match(html, /Започнах да играя с по-голяма увереност/);
  assert.match(html, /data-cta-location="after_reviews"/);
  assert.ok(html.indexOf('id="player-results"') > html.indexOf('id="training-video"'));
  assert.ok(html.indexOf('id="player-results"') < html.indexOf('id="how-it-works"'));
  assert.match(html, /Какво се случва след заявката\?/);
  assert.match(html, /От първия разговор до обратната връзка след тренировката — ето как започваме\./);
  assert.match(html, /Попълваш формата\. До 24 часа се свързвам с теб/);
  assert.match(html, /Запознавам се с нивото ти и работим върху упражнения/);
  assert.match(html, /<h3>Обратна връзка<\/h3>/);
  assert.match(html, /<\/ol>\s*<p class="steps-parent-note">Родителите могат да присъстват на тренировката и да задават въпроси\.<\/p>/);
  assert.doesNotMatch(html, /Ясен следващ фокус|наблюдаваме конкретни действия/);
  assert.equal((html.match(/class="training-video-detail"/g) || []).length, 3);
});

test("landing form contains only the compact approved fields and success message", () => {
  const html = read("individual-training.html");
  const form = html.match(/<form\b[\s\S]*?<\/form>/i)?.[0] || "";

  ["applicant_type", "name", "player_age", "city", "phone", "consent"].forEach((name) => {
    assert.match(form, new RegExp(`name="${name}"`));
  });
  assert.doesNotMatch(form, /novalidate/);
  assert.match(form, /min="7" max="24"/);
  assert.match(form, /<select name="city" required>/);
  assert.match(form, /data-landing-form-status[^>]*><\/p>/);
  assert.match(form, /type="number" name="player_age"/);
  assert.doesNotMatch(form, /name="email"|position|goal/);
  assert.match(form, /Моето дете/);
  assert.match(form, /Себе си/);
  assert.match(form, /Заяви безплатна тренировка/);
  assert.match(form, /Съгласявам се предоставените от мен данни/);
  assert.match(form, /\/privacy-policy/);
  assert.match(
    html,
    /Благодарим! Получихме заявката ти\. Ще се свържем с теб, за да уточним подходящ ден и час\./,
  );
});

test("landing page uses real training media, player proof, FAQ, and compact legal footer", () => {
  const html = read("individual-training.html");

  assert.doesNotMatch(html, /assets\/videos\/hero-hat-swap-game\.mp4/);
  assert.match(html, /training-video-card-grid/);
  assert.match(html, /assets\/videos\/individual-tech-first-touch\.mp4/);
  assert.match(html, /assets\/videos\/individual-speed-explosiveness\.mp4/);
  assert.match(html, /assets\/videos\/individual-decisions-game-situations\.mp4/);
  assert.match(html, /assets\/videos\/individual-tech-first-touch-poster\.webp/);
  assert.match(html, /assets\/videos\/individual-speed-explosiveness-poster\.webp/);
  assert.match(html, /assets\/videos\/individual-decisions-game-situations-poster\.webp/);
  assert.equal((html.match(/<button type="button" data-video-play/g) || []).length, 3);
  assert.match(html, /assets\/coach-yordan-zhelev\.webp/);
  assert.doesNotMatch(html, /yordan-zhelev-match-dribble\.webp/);
  assert.match(html, /<h2>Йордан Желев<\/h2>/);
  assert.match(html, /<h3 class="training-coach-subtitle">От професионалния футбол до твоето развитие\.<\/h3>/);
  assert.match(html, /помагам на играчите да развиват своите качества чрез индивидуални тренировки/);
  assert.match(html, /<section id="coach-proof" class="training-coach-grid">/);
  assert.doesNotMatch(html, /id="coach-proof"[^>]*>[\s\S]{0,80}<div class="wrap/);
  assert.match(html, /padding: clamp\(76px,9vw,124px\) max\(18px,calc\(\(100vw - 1180px\)\/2\)\)/);
  assert.match(html, /background: #fff8e2;/);
  assert.match(html, /\.training-coach-copy h2 \{[^}]*color: #172d26;/);
  assert.match(html, /\.training-coach-copy > p:not\(\.training-coach-eyebrow\) \{ color: #344d40;/);
  assert.match(html, /\.training-coach-eyebrow \{[^}]*color: #00664c;/);
  assert.match(html, /\.training-coach-copy li::before \{[^}]*color: #00664c;/);
  assert.match(html, /class="button training-coach-cta"/);
  assert.match(html, /\.hero-actions \.button, \.training-coach-cta \{ gap: 10px; padding-inline: 18px; font-size: \.9rem; \}/);
  assert.match(html, /\.training-coach-copy ul \{ display: grid; gap: 16px;/);
  assert.match(html, /\.training-coach-copy li \{[^}]*font-size: 16px;/);
  assert.match(html, /\.training-coach-copy > p:not\(\.training-coach-eyebrow\) \{ font-size: 17px; \}/);
  assert.doesNotMatch(html, /#coach-proof[\s\S]{0,300}radial-gradient/);
  assert.match(html, /grid-template-columns: minmax\(340px,\.76fr\) minmax\(0,1fr\)/);
  assert.match(html, /\.training-coach-media img \{ width: 100%; height: 600px/);
  assert.match(html, /font-size: clamp\(38px,5vw,66px\)/);
  assert.match(html, /\.button, \.landing-button, \.training-sticky-cta \{[\s\S]{0,160}min-height: 48px;/);
  assert.match(html, /#coach-proof \{ padding: 70px 18px; \}/);
  assert.equal((html.match(/<li>/g) || []).length >= 4, true);
  for (const [, asset] of html.matchAll(/(?:src|poster)="(\/assets\/[^"?]+)/g)) {
    assert.ok(fs.existsSync(path.join(root, asset)), asset);
  }
  assert.match(html, /Техника и първо докосване/);
  assert.match(html, /Скорост и експлозивност/);
  assert.match(html, /Виж как тренираме/);
  assert.match(html, /Реални кадри от индивидуалните тренировки\. Всяко упражнение има конкретна цел\./);
  assert.match(html, /Решения в игрови ситуации/);
  assert.equal((html.match(/class="training-video-detail"/g) || []).length, 3);
  assert.doesNotMatch(html, /<strong>Следим:<\/strong>|<strong>Корекция:<\/strong>/);
  assert.doesNotMatch(html, /class="training-video-note"/);
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
    "scroll_25",
    "scroll_50",
    "scroll_75",
    "scroll_90",
    "click_primary_cta",
    "click_secondary_cta",
    "click_sticky_cta",
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
  assert.match(script, /\["\/individual-training", "individual-training"\]/);
  assert.match(script, /validateTrainingForm/);
  assert.match(script, /formData\.get\("player_age"\)/);
  assert.match(script, /playerAge:\s*formData\.get\("player_age"\)/);
  assert.match(script, /formData\.get\("consent"\) !== "yes"/);
  assert.match(script, /consent:\s*formData\.get\("consent"\) === "yes"/);
  assert.match(script, /sessionId/);
  assert.match(script, /sendMarketingEvent\("training_cta_click"/);
  assert.match(script, /sendMarketingEvent\("training_form_start"/);
  assert.match(script, /sendMarketingEvent\("generate_lead"/);
  assert.match(script, /sendMarketingEvent\("training_form_error"/);
  assert.match(script, /fbq\("track", "Lead"/);
  assert.match(script, /ttq\.track\("SubmitForm"/);
  assert.match(script, /form_submit_error/);
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
    "scroll_25",
    "scroll_50",
    "scroll_75",
    "scroll_90",
    "click_primary_cta",
    "click_secondary_cta",
    "click_sticky_cta",
    "form_start",
    "form_submit_success",
    "form_submit_error",
  ].forEach((eventName) => assert.match(endpoint, new RegExp(eventName)));

  assert.match(endpoint, /landing_analytics_events/);
  assert.match(endpoint, /META_PIXEL_ID/);
  assert.match(endpoint, /GA4_MEASUREMENT_ID/);
  assert.match(endpoint, /TIKTOK_PIXEL_ID/);
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
    "session_id",
  ].forEach((field) => {
    assert.match(endpoint, new RegExp(field));
    assert.match(adminEndpoint, new RegExp(field));
  });
  assert.match(endpoint, /const consent = Boolean\(body\.consent\)/);
  assert.match(endpoint, /const playerAge = cleanText\(body\.playerAge/);
  assert.match(endpoint, /player_age:\s*playerAge/);
  assert.match(endpoint, /if \(!consent\)/);
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
  assert.match(schema, /click_sticky_cta/);
  assert.doesNotMatch(analyticsBlock, /ip_address|customer_name|phone|email/);
});

test("protected admin analytics API supports filters and funnel summaries", () => {
  const endpoint = read("api/admin/landing-analytics.js");

  assert.match(endpoint, /verifyAdminToken/);
  assert.match(endpoint, /landing_analytics_events/);
  assert.match(endpoint, /landing_page_url/);
  assert.match(endpoint, /page_variant/);
  assert.match(endpoint, /utm_source/);
  assert.match(endpoint, /utm_medium/);
  assert.match(endpoint, /utm_campaign/);
  assert.match(endpoint, /device_type/);
  assert.match(endpoint, /dashboards/);
  assert.match(endpoint, /individualTraining/);
  assert.match(endpoint, /summerProgram/);
  assert.match(endpoint, /primaryCtaClicks/);
  assert.match(endpoint, /secondaryCtaClicks/);
  assert.match(endpoint, /stickyCtaClicks/);
  assert.match(endpoint, /scroll25/);
  assert.match(endpoint, /scroll75/);
  assert.match(endpoint, /formSubmitSuccess/);
  assert.match(endpoint, /formSubmitError/);
  assert.match(endpoint, /ctaConversionRate/);
  assert.match(endpoint, /pageViews/);
  assert.match(endpoint, /uniqueSessions/);
  assert.match(endpoint, /ctaClicks/);
  assert.match(endpoint, /formStarts/);
  assert.match(endpoint, /formSubmissions/);
  assert.match(endpoint, /conversionRate/);
  assert.match(endpoint, /byLandingPage/);
  assert.match(endpoint, /byVariant/);
  assert.match(endpoint, /byCampaign/);
  assert.match(endpoint, /mainWebsite/);
  assert.match(endpoint, /bySourceCampaign/);
  assert.match(endpoint, /byDevice/);
  assert.match(endpoint, /byReferrer/);
});

test("admin panel shows lead attribution and landing analytics", () => {
  const html = read("admin-orders.html");
  const script = read("admin-orders.js");

  assert.match(html, /<h2>Landing Pages<\/h2>/);
  assert.match(html, /Individual Training Dashboard/);
  assert.match(html, /Summer Program Dashboard/);
  assert.match(html, /Main Website \/ General/);
  assert.match(html, /data-landing-comparison/);
  assert.match(html, /data-individual-dashboard-summary/);
  assert.match(html, /data-summer-dashboard-summary/);
  assert.match(html, /data-individual-funnel/);
  assert.match(html, /data-summer-funnel/);
  assert.match(html, /data-individual-leads-table/);
  assert.match(html, /data-summer-orders-table/);
  assert.match(html, /data-landing-analytics-filters/);
  assert.match(html, /data-landing-analytics-summary/);
  assert.match(html, /name="period"/);
  assert.match(html, /name="landing_page_url"/);
  assert.match(html, /name="page_variant"/);
  assert.match(html, /name="device_type"/);
  assert.match(html, /Funnel heatmap/);
  assert.match(html, /data-landing-funnel-table/);
  assert.match(html, /data-landing-variant-table/);
  assert.match(html, /data-landing-campaign-table/);
  assert.match(html, /Landing page/);
  assert.match(html, /Кампания/);
  assert.match(script, /\/api\/admin\/landing-analytics/);
  assert.match(script, /landingFunnelTable/);
  assert.match(script, /landingComparison/);
  assert.match(script, /individualDashboardSummary/);
  assert.match(script, /Sticky CTA Clicks/);
  assert.match(script, /summerDashboardSummary/);
  assert.match(script, /mainWebsiteDashboardSummary/);
  assert.match(script, /individualLeadsTable/);
  assert.match(script, /summerOrdersTable/);
  assert.match(script, /analyticsDateRange/);
  assert.match(script, /matchesLandingFilters/);
  assert.match(script, /byLandingPage/);
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
