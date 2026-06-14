# Individual Training Landing Page and Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/individual-training` as a mobile-first campaign landing page with first-party cookieless funnel analytics, campaign attribution, Supabase retention, and admin reporting.

**Architecture:** Keep the existing static frontend and Vercel Functions architecture. The campaign page uses focused HTML/CSS and a small JavaScript tracker; public APIs validate and persist anonymous events and attributed training requests; protected admin APIs return server-side funnel aggregates rather than raw event exports.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js Vercel Functions, Supabase Postgres/PostgREST, Node built-in test runner, Vercel production deployment.

---

## File Map

- Create `individual-training.html`: focused campaign page and form.
- Create `individual-training.css`: landing-only mobile-first styles.
- Create `individual-training.js`: session analytics, scroll/CTA/form tracking, UTM attribution, form submission.
- Create `api/landing-analytics.js`: public event ingestion.
- Create `api/admin/landing-analytics.js`: protected funnel summaries and filter options.
- Create `tests/individual-training-landing.test.js`: page, tracking, API, admin, schema, and privacy contract tests.
- Modify `api/training-requests.js`: accept and save optional attribution.
- Modify `api/admin/training-requests.js`: return attribution columns.
- Modify `admin-orders.html`: add request attribution columns and analytics dashboard.
- Modify `admin-orders.js`: render attribution, filters, funnel cards, and breakdown tables.
- Modify `styles.css`: admin analytics layout only.
- Modify `supabase/schema.sql`: attribution columns, event table, indexes, aggregation function, and retention function.
- Modify `privacy-policy.html` and `cookie-policy.html`: disclose cookieless first-party session analytics.
- Modify `vercel.json`: expose `/individual-training`.

### Task 1: Lock the Landing Page Contract with Failing Tests

**Files:**
- Create: `tests/individual-training-landing.test.js`
- Test: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Add route and content tests**

Add tests that require:

```js
test("individual training campaign route and page exist", () => {
  const rewrites = new Map(JSON.parse(read("vercel.json")).rewrites.map((item) => [item.source, item.destination]));
  assert.equal(rewrites.get("/individual-training"), "/individual-training.html");
  assert.ok(fs.existsSync(path.join(root, "individual-training.html")));
});

test("landing page contains the approved conversion structure", () => {
  const html = read("individual-training.html");
  assert.match(html, /Индивидуални футболни тренировки за играчи, които искат реален прогрес/);
  assert.match(html, /Персонална работа върху техника, първо докосване, дрибъл, скорост, завършване и увереност с топката/);
  assert.match(html, /data-primary-cta/);
  assert.match(html, /data-secondary-cta/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /id="training-form"/);
  assert.match(html, /data-mobile-sticky-cta/);
});

test("landing form contains only the compact approved fields", () => {
  const html = read("individual-training.html");
  const form = html.match(/<form\b[\s\S]*?<\/form>/i)?.[0] || "";
  ["applicant_type", "name", "city", "phone"].forEach((name) => {
    assert.match(form, new RegExp(`name="${name}"`));
  });
  assert.doesNotMatch(form, /name="email"|player_age|position|goal/);
  assert.match(form, /Запази тренировка/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
& 'C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/individual-training-landing.test.js
```

Expected: failures because the page and route do not exist.

- [ ] **Step 3: Commit the failing contract**

```powershell
git add tests/individual-training-landing.test.js
git commit -m "test: define individual training landing contract"
```

### Task 2: Build the Static Mobile-First Landing Page

**Files:**
- Create: `individual-training.html`
- Create: `individual-training.css`
- Modify: `vercel.json`
- Test: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Add the clean route**

Add to `vercel.json` rewrites:

```json
{
  "source": "/individual-training",
  "destination": "/individual-training.html"
}
```

- [ ] **Step 2: Create the semantic page structure**

Create the page with:

```html
<body class="training-landing" data-page-variant="general">
  <header class="training-landing-header">
    <a href="/" aria-label="Become Pro начало">...</a>
    <a href="#training-form" data-primary-cta>Запази тренировка</a>
  </header>
  <main>
    <section class="training-landing-hero">...</section>
    <section id="training-fit">...</section>
    <section id="player-benefits">...</section>
    <section id="how-it-works">...</section>
    <section id="player-results">...</section>
    <section id="training-video">...</section>
    <section id="training-faq">...</section>
    <section id="training-form">...</section>
  </main>
  <a class="training-sticky-cta" href="#training-form" data-primary-cta data-mobile-sticky-cta>
    Запази тренировка
  </a>
</body>
```

Use existing verified assets:

- Hero video: `/assets/videos/hero-hat-swap-game.mp4`
- Video poster: `/assets/yordan-training-poster.png`
- Player cards: existing named player assets and only factual text already present in `players.html`
- Brand logo: `/assets/becomepro-logo.png`

- [ ] **Step 3: Add landing-only styles**

Implement:

```css
.training-landing {
  background: #050505;
  color: #f7f3e8;
}

.training-landing-shell {
  width: min(1120px, calc(100% - 32px));
  margin-inline: auto;
}

.training-landing-hero {
  display: grid;
  gap: 28px;
  min-height: 88svh;
  align-items: center;
}

.training-sticky-cta {
  display: none;
}

@media (max-width: 720px) {
  .training-landing-hero {
    min-height: auto;
    padding-block: 40px 28px;
  }

  .training-sticky-cta {
    position: fixed;
    display: flex;
    left: 16px;
    right: 16px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    z-index: 50;
    min-height: 54px;
  }

  .training-landing-footer {
    padding-bottom: 96px;
  }
}
```

- [ ] **Step 4: Run the landing contract tests**

Expected: route, copy, form, sections, and sticky CTA tests pass.

- [ ] **Step 5: Commit**

```powershell
git add individual-training.html individual-training.css vercel.json tests/individual-training-landing.test.js
git commit -m "feat: add individual training campaign page"
```

### Task 3: Define Analytics and Attribution Contracts

**Files:**
- Modify: `tests/individual-training-landing.test.js`
- Test: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Add failing client tracking tests**

Require all event names, `sessionStorage`, UTM fields, sendBeacon/fetch fallback, and no personal fields:

```js
test("landing tracker emits the approved anonymous funnel events", () => {
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
  assert.match(script, /sessionStorage/);
  assert.match(script, /navigator\.sendBeacon/);
  assert.match(script, /keepalive:\s*true/);
  assert.doesNotMatch(script, /analyticsPayload[\s\S]*\b(name|phone|email)\b/);
});
```

- [ ] **Step 2: Add failing API validation tests**

Load `api/landing-analytics.js` with a stubbed shared module and assert:

```js
assert.equal(validResponse.statusCode, 201);
assert.equal(invalidEventResponse.statusCode, 400);
assert.equal(personalDataResponse.statusCode, 400);
assert.equal(storedRow.ip_address, undefined);
assert.equal(storedRow.name, undefined);
assert.equal(storedRow.phone, undefined);
```

- [ ] **Step 3: Add failing request attribution tests**

Require `api/training-requests.js` to map:

```js
landing_page_url
page_variant
utm_source
utm_medium
utm_campaign
utm_content
utm_term
referrer
device_type
browser
```

- [ ] **Step 4: Run and verify RED**

Expected: missing client script, event endpoint, and attribution persistence.

- [ ] **Step 5: Commit**

```powershell
git add tests/individual-training-landing.test.js
git commit -m "test: define landing analytics and attribution"
```

### Task 4: Implement the Lightweight Analytics Client and Form Flow

**Files:**
- Create: `individual-training.js`
- Modify: `individual-training.html`
- Test: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Implement normalized campaign context**

Use:

```js
const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const params = new URLSearchParams(window.location.search);
const campaign = Object.fromEntries(CAMPAIGN_KEYS.map((key) => [key, (params.get(key) || "").slice(0, 160)]));
const pageVariant = document.body.dataset.pageVariant || "general";
const landingPageUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
```

- [ ] **Step 2: Create a session-only anonymous identifier**

```js
const SESSION_KEY = "bp_landing_session_id";
const sessionId =
  sessionStorage.getItem(SESSION_KEY) ||
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
sessionStorage.setItem(SESSION_KEY, sessionId);
```

- [ ] **Step 3: Implement `track(eventName)`**

The payload contains only:

```js
{
  sessionId,
  landingPageUrl,
  pageVariant,
  eventName,
  ...campaign,
  referrer: document.referrer.slice(0, 500),
  deviceType: window.matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop"
}
```

Send with `navigator.sendBeacon("/api/landing-analytics", blob)` and fall back to:

```js
fetch("/api/landing-analytics", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  keepalive: true,
}).catch(() => {});
```

- [ ] **Step 4: Wire event triggers**

- Track `page_view` once on load.
- Track `scroll_50` and `scroll_90` once after crossing each threshold.
- Track each primary and secondary CTA click.
- Track `form_start` once on the first `input`, `change`, or focus within the form.

- [ ] **Step 5: Submit the attributed form**

POST:

```js
{
  applicantType: formData.get("applicant_type"),
  name: formData.get("name"),
  city: formData.get("city"),
  phone: formData.get("phone"),
  attribution: {
    landingPageUrl,
    pageVariant,
    ...campaign,
    referrer: document.referrer.slice(0, 500),
    deviceType,
    browser: navigator.userAgent.slice(0, 300)
  }
}
```

Track success/error only after the server response and display the exact approved Bulgarian success message.

- [ ] **Step 6: Run tests and commit**

```powershell
git add individual-training.html individual-training.js tests/individual-training-landing.test.js
git commit -m "feat: track campaign funnel and submit attributed leads"
```

### Task 5: Implement Analytics Persistence and Request Attribution

**Files:**
- Create: `api/landing-analytics.js`
- Modify: `api/training-requests.js`
- Modify: `api/admin/training-requests.js`
- Test: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Implement strict event ingestion**

Use:

```js
const EVENT_NAMES = new Set([
  "page_view",
  "scroll_50",
  "scroll_90",
  "click_primary_cta",
  "click_secondary_cta",
  "form_start",
  "form_submit_success",
  "form_submit_error",
]);
```

Reject unexpected keys associated with personal data:

```js
if (["name", "phone", "email"].some((key) => body[key] != null)) {
  return sendJson(res, 400, { error: "Personal data is not accepted by analytics." });
}
```

Persist a snake-case row through `supabaseRequest("landing_analytics_events", ...)`. Do not access `x-forwarded-for`, `x-real-ip`, or any request IP property.

- [ ] **Step 2: Add safe attribution cleaners**

In `api/training-requests.js`, limit URL/referrer to 500 characters, browser to 300, and UTM/variant/device fields to 160.

- [ ] **Step 3: Persist attribution with the lead**

Extend the modern insert row with the attribution columns. Preserve the existing legacy fallback insert when production has not yet received the schema migration.

- [ ] **Step 4: Return attribution to the admin endpoint**

Extend the modern PostgREST select in `api/admin/training-requests.js`. Keep the existing legacy select fallback.

- [ ] **Step 5: Run tests and commit**

```powershell
git add api/landing-analytics.js api/training-requests.js api/admin/training-requests.js tests/individual-training-landing.test.js
git commit -m "feat: persist landing analytics and lead attribution"
```

### Task 6: Add the Supabase Schema, Indexes, Aggregation, and Retention

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Add failing schema tests**

Require:

```js
assert.match(schema, /create table if not exists public\.landing_analytics_events/);
assert.match(schema, /delete_expired_landing_analytics/);
assert.doesNotMatch(analyticsTableBlock, /ip_address|customer_name|phone|email/);
assert.match(schema, /interval '12 months'/);
```

- [ ] **Step 2: Add request attribution columns**

Use idempotent `alter table ... add column if not exists` statements for all attribution fields.

- [ ] **Step 3: Create the event table and constraints**

Define `event_name` with the eight approved values and enable RLS without a public insert policy.

- [ ] **Step 4: Add query-aligned indexes**

Create indexes on:

```sql
(event_time desc)
(page_variant, event_time desc)
(utm_campaign, event_time desc)
(session_id, event_time desc)
(event_name, event_time desc)
```

Add request indexes for `page_variant` and `utm_campaign`.

- [ ] **Step 5: Add retention function**

```sql
create or replace function public.delete_expired_landing_analytics()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare deleted_count integer;
begin
  delete from public.landing_analytics_events
  where event_time < now() - interval '12 months';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
```

Include guarded `pg_cron` scheduling that does not make the rest of the migration fail if the extension is unavailable.

- [ ] **Step 6: Run tests and commit**

```powershell
git add supabase/schema.sql tests/individual-training-landing.test.js
git commit -m "feat: add landing analytics database model"
```

### Task 7: Implement Protected Funnel Aggregation

**Files:**
- Create: `api/admin/landing-analytics.js`
- Modify: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Add failing protected API tests**

Verify:

- Missing admin cookie returns `401`.
- Invalid dates return `400`.
- Allowed filters are passed to PostgREST safely.
- Summary includes `pageViews`, `uniqueSessions`, `ctaClicks`, `formStarts`, `formSubmissions`, and `conversionRate`.

- [ ] **Step 2: Implement filter parsing**

Accept:

```text
start
end
page_variant
utm_source
utm_medium
utm_campaign
```

Default to the last 30 days and cap ranges at 366 days.

- [ ] **Step 3: Query only the filtered columns**

Fetch:

```text
session_id,event_name,page_variant,utm_source,utm_medium,utm_campaign,event_time
```

Do not return raw rows to the browser.

- [ ] **Step 4: Aggregate by unique session**

Calculate:

```js
const conversionRate = pageViewSessions.size
  ? Number(((submitSessions.size / pageViewSessions.size) * 100).toFixed(2))
  : 0;
```

Return `summary`, `byVariant`, `byCampaign`, and filter option arrays.

- [ ] **Step 5: Run tests and commit**

```powershell
git add api/admin/landing-analytics.js tests/individual-training-landing.test.js
git commit -m "feat: add protected landing funnel reports"
```

### Task 8: Add Landing Analytics to the Admin Panel

**Files:**
- Modify: `admin-orders.html`
- Modify: `admin-orders.js`
- Modify: `styles.css`
- Modify: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Add failing admin UI tests**

Require:

```js
assert.match(html, /Landing Page Analytics/);
assert.match(html, /data-landing-analytics-filters/);
assert.match(html, /data-landing-analytics-summary/);
assert.match(html, /data-landing-variant-table/);
assert.match(html, /data-landing-campaign-table/);
assert.match(script, /\/api\/admin\/landing-analytics/);
```

- [ ] **Step 2: Extend training request columns**

Add table columns:

- Landing page
- Кампания
- Град
- Телефон
- Статус
- Дата

Display `page_variant` and `utm_campaign`, falling back to `-`.

- [ ] **Step 3: Add analytics filters**

Add date inputs and select/text controls for page variant, source, medium, and campaign, with apply/reset buttons.

- [ ] **Step 4: Add summary and breakdown containers**

Create six summary cards and two responsive tables for variant and campaign performance.

- [ ] **Step 5: Implement admin loading and rendering**

Build the query with `URLSearchParams`, call `/api/admin/landing-analytics`, escape all rendered values, and reuse the existing unauthorized redirect.

- [ ] **Step 6: Add responsive admin styles**

Use an auto-fit card grid and horizontally scrollable tables on small screens.

- [ ] **Step 7: Run tests and commit**

```powershell
git add admin-orders.html admin-orders.js styles.css tests/individual-training-landing.test.js
git commit -m "feat: show landing funnel analytics in admin"
```

### Task 9: Update Privacy Disclosures

**Files:**
- Modify: `privacy-policy.html`
- Modify: `cookie-policy.html`
- Modify: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Add failing policy tests**

Require both pages to mention:

- first-party analytics
- no advertising cookies
- anonymous session identifier
- 12-month event retention
- no name, phone, email, or IP in analytics events

- [ ] **Step 2: Add concise Bulgarian disclosures**

Clarify that personal details are processed only when the training form is submitted and are stored separately from anonymous behavioral events.

- [ ] **Step 3: Run tests and commit**

```powershell
git add privacy-policy.html cookie-policy.html tests/individual-training-landing.test.js
git commit -m "docs: disclose cookieless landing analytics"
```

### Task 10: Full Automated and Local Browser QA

**Files:**
- Modify only if a verified defect is found.

- [ ] **Step 1: Run the complete test suite**

```powershell
& 'C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.js
```

Expected: zero failures.

- [ ] **Step 2: Start the local site**

Serve the workspace at `http://127.0.0.1:4173`.

- [ ] **Step 3: Verify desktop**

Check:

- all required sections
- both CTA scroll targets
- media loading
- FAQ controls
- form validation and submit states
- no console errors or horizontal overflow

- [ ] **Step 4: Verify mobile at 390x844**

Check:

- sticky CTA visibility and form scroll
- tap targets
- video sizing
- player cards
- form not covered by sticky CTA
- footer spacing
- no horizontal overflow

- [ ] **Step 5: Verify local analytics payloads**

Confirm each event is emitted with UTM and no personal fields. Confirm form submission includes attribution only in the lead request.

- [ ] **Step 6: Commit any QA fixes and rerun all tests**

### Task 11: Apply Supabase Migration and Verify Production Data

**Files:**
- No source edits unless migration reveals a compatibility defect.

- [ ] **Step 1: Run the complete `supabase/schema.sql` in Supabase SQL Editor**

Verify successful creation of:

- attribution columns
- `landing_analytics_events`
- indexes
- retention function
- optional scheduled cleanup

- [ ] **Step 2: Send a controlled analytics session**

Visit:

```text
/individual-training?utm_source=codex_qa&utm_medium=qa&utm_campaign=landing_launch
```

Trigger page view, CTA, scroll, form start, and form success.

- [ ] **Step 3: Verify Supabase rows**

Confirm:

- event rows contain the expected session and UTM values
- event rows contain no personal data columns
- the training request contains attribution and personal form fields

### Task 12: Deploy and Run Production QA

**Files:**
- No source edits unless production verification finds a defect.

- [ ] **Step 1: Push the tested commits**

```powershell
git push origin main
```

- [ ] **Step 2: Confirm Vercel production deployment is Ready**

Verify the deployment commit matches local `HEAD`.

- [ ] **Step 3: Run desktop and mobile production checks**

Repeat the local checklist at:

```text
https://become-pro-ivory.vercel.app/individual-training
```

- [ ] **Step 4: Verify production analytics and request flow**

Use the `codex_qa` UTM URL, submit one clearly labeled test request, verify Vercel responses, Supabase rows, and admin presentation.

- [ ] **Step 5: Verify admin funnel statistics**

Filter by:

- current date
- variant `general`
- source `codex_qa`
- medium `qa`
- campaign `landing_launch`

Confirm page views, unique sessions, CTA clicks, form starts, submissions, and conversion rate match the controlled session.

- [ ] **Step 6: Produce the QA report**

Report:

- page created
- active event list
- admin locations
- migration status
- desktop/mobile results
- form and attribution results
- funnel metric results
- exact workflow for adding a future variant
- any remaining launch blocker
