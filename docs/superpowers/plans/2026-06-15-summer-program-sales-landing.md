# Summer Program Sales Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, track, deploy, and verify a dedicated `/summer-program` advertising landing page that sells only the Become Pro Summer Program through direct Stripe Checkout.

**Architecture:** Add a focused static HTML/CSS/JavaScript landing surface while reusing the existing Stripe Checkout, Supabase analytics, admin dashboard, webhook fulfillment, and legal pages. Browser events continue through the existing `/api/landing-analytics` Vercel Function; checkout attribution is sanitized by `/api/create-checkout-session`, copied into Stripe metadata, and converted into an idempotent `purchase_completed` analytics row only by the verified Stripe webhook. No new Vercel Function files are created, keeping the Hobby deployment at 12 functions.

**Tech Stack:** Static HTML5, CSS, vanilla JavaScript, Node.js Vercel Functions, Stripe Checkout and webhooks, Supabase Postgres/PostgREST, Node built-in test runner, Playwright/Chrome visual QA, Vercel production deployment.

---

## File Structure

- Create `summer-program.html` — dedicated sales page markup and conversion copy.
- Create `summer-program.css` — isolated black-and-gold responsive styling and mobile sticky CTA.
- Create `summer-program.js` — anonymous funnel tracking, section visibility events, direct checkout, and UI error handling.
- Create `tests/summer-program-landing.test.js` — route, content, tracking, checkout attribution, purchase-event, admin, and function-limit regression tests.
- Modify `vercel.json` — expose `/summer-program` without changing `/programs/summer-program`.
- Modify `api/landing-analytics.js` — accept the approved browser-side Summer Program events while continuing to reject personal data and server-only purchase events.
- Modify `api/create-checkout-session.js` — sanitize optional anonymous landing attribution and pass it to Stripe session creation.
- Modify `api/_shared.js` — copy landing attribution into Checkout Session and PaymentIntent metadata.
- Modify `api/stripe/webhook.js` — insert the idempotent server-side `purchase_completed` event after a verified paid Summer Program session.
- Modify `supabase/schema.sql` — extend the analytics event constraint, add commerce attribution columns, and add a unique purchase-event index.
- Modify `api/admin/landing-analytics.js` — calculate checkout and purchase metrics alongside existing training-form metrics.
- Modify `admin-orders.html` — show the expanded commerce funnel columns.
- Modify `admin-orders.js` — render checkout starts, created sessions, purchases, and purchase conversion.
- Modify `styles.css` — only shared admin dashboard styles needed by the wider funnel table.

### Task 1: Add the Dedicated Route and Structural Contract

**Files:**
- Create: `tests/summer-program-landing.test.js`
- Modify: `vercel.json`

- [ ] **Step 1: Write the failing route and page-isolation tests**

Create `tests/summer-program-landing.test.js` with:

```js
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
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```powershell
& 'C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\summer-program-landing.test.js
```

Expected: FAIL because `/summer-program` and `summer-program.html` do not exist.

- [ ] **Step 3: Add the clean route**

Add this rewrite to `vercel.json` before the existing product detail rewrites:

```json
{
  "source": "/summer-program",
  "destination": "/summer-program.html"
}
```

Do not alter:

```json
{
  "source": "/programs/summer-program",
  "destination": "/programs/summer-program/index.html"
}
```

- [ ] **Step 4: Run the route test again**

Expected: it still FAILS only because `summer-program.html` has not been created.

- [ ] **Step 5: Commit the route contract**

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add vercel.json tests\summer-program-landing.test.js
& 'C:\Program Files\Git\cmd\git.exe' commit -m "Test summer program advertising route"
```

### Task 2: Build the Focused Sales Page Markup

**Files:**
- Create: `summer-program.html`
- Test: `tests/summer-program-landing.test.js`

- [ ] **Step 1: Extend the failing content assertions**

Add:

```js
test("summer program landing uses approved sales copy and trust content", () => {
  const html = read("summer-program.html");

  assert.match(html, /Лятна програма/);
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
```

- [ ] **Step 2: Run the test and verify the content contract fails**

Expected: FAIL for the missing approved sections and copy.

- [ ] **Step 3: Create `summer-program.html`**

Use this document structure:

```html
<!DOCTYPE html>
<html lang="bg">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Лятна футболна програма | Become Pro</title>
    <meta
      name="description"
      content="Структурирана лятна футболна програма с технически тренировки, скорост, физическа подготовка и ясен план."
    />
    <meta name="theme-color" content="#050505" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="stylesheet" href="/summer-program.css" />
  </head>
  <body class="summer-sales-page" data-page-variant="summer-program">
    <header class="summer-header">
      <a class="summer-brand" href="#summer-hero" aria-label="Become Pro Лятна програма">
        <img src="/assets/becomepro-logo.png" alt="Become Pro" />
        <span>BECOME PRO</span>
      </a>
      <button class="summer-header-cta" type="button" data-summer-checkout>Вземи програмата</button>
    </header>

    <main>
      <section id="summer-hero" class="summer-hero">
        <div class="summer-hero-copy">
          <p class="summer-eyebrow">ЛЯТНА ПРОГРАМА · ЕДНОКРАТНО ПЛАЩАНЕ</p>
          <h1>Използвай лятото, за да се върнеш по-подготвен за новия сезон</h1>
          <p class="summer-lead">
            Структуриран план за футболисти и родители, които не искат лятната пауза да се превърне в загубено време.
          </p>
          <div class="summer-price-inline"><strong>0,50 €</strong><span>Еднократно · без абонамент</span></div>
          <button class="summer-primary-cta" type="button" data-summer-checkout data-primary-cta>
            Вземи Лятната програма
          </button>
          <p class="summer-trust-line">Сигурно плащане чрез Stripe · Моментален достъп по имейл</p>
        </div>
        <div class="summer-hero-media">
          <img src="/assets/program-cover-summer.png" alt="Become Pro Лятна програма" />
        </div>
      </section>

      <section id="summer-problem" class="summer-section" data-track-view="view_problem">
        <p class="summer-eyebrow">ПРОБЛЕМЪТ</p>
        <h2>Без план лятната пауза лесно се превръща в загуба на ритъм</h2>
        <div class="summer-card-grid summer-problem-grid">
          <article>Случайни тренировки без ясна последователност</article>
          <article>Непостоянна работа върху техника и физика</article>
          <article>Неяснота какво да тренираш и кога</article>
          <article>Трудно връщане към ритъм преди новия сезон</article>
        </div>
      </section>

      <section id="summer-solution" class="summer-section summer-panel" data-track-view="view_solution">
        <p class="summer-eyebrow">РЕШЕНИЕТО</p>
        <h2>Една ясна система вместо хаотични летни тренировки</h2>
        <p>
          Лятната програма събира техниката, скоростта и физическата подготовка в последователен план,
          който играчът може да следва стъпка по стъпка.
        </p>
      </section>

      <section id="summer-benefits" class="summer-section">
        <p class="summer-eyebrow">КАКВО ПОЛУЧАВАШ</p>
        <h2>Четири основи за смислена лятна подготовка</h2>
        <div class="summer-card-grid summer-benefit-grid">
          <article><span>01</span><h3>Технически тренировки</h3><p>Работа с топка, контрол и увереност.</p></article>
          <article><span>02</span><h3>Скорост и експлозивност</h3><p>Ускорение, реакция и динамични действия.</p></article>
          <article><span>03</span><h3>Физическа подготовка</h3><p>Сила, издръжливост и стабилна основа.</p></article>
          <article><span>04</span><h3>Ясен план за действие</h3><p>Подредена структура без чудене какво следва.</p></article>
        </div>
      </section>

      <section id="summer-contents" class="summer-section" data-track-view="view_program_contents">
        <p class="summer-eyebrow">КАКВО ВКЛЮЧВА</p>
        <h2>Пълна система за работа през лятото</h2>
        <ul class="summer-included-list">
          <li>Фитнес програми – нива 1, 2 и 3</li>
          <li>Скоростна програма</li>
          <li>Технически пакет</li>
          <li>Ball Mastery с над 80 упражнения</li>
          <li>Практичен хранителен наръчник</li>
          <li>Ежедневни задачи и насоки в PDF програмата</li>
        </ul>
      </section>

      <section id="summer-fit" class="summer-section">
        <p class="summer-eyebrow">ЗА КОГО Е</p>
        <h2>За амбициозни играчи и родители, които търсят ясна посока</h2>
        <div class="summer-card-grid">
          <article>Футболисти, които искат структурирана самостоятелна работа</article>
          <article>Родители, които търсят допълнителен план за развитие</article>
          <article>Играчи, които вече тренират в клуб</article>
          <article>Футболисти, които искат да запазят или подобрят нивото си</article>
        </div>
      </section>

      <section id="summer-proof" class="summer-proof">
        <article><strong>50+</strong><span>футболисти</span></article>
        <article><strong>100+</strong><span>проведени тренировки</span></article>
      </section>

      <section id="summer-price" class="summer-price-section" data-track-view="view_price">
        <p class="summer-eyebrow">ВЗЕМИ ПРОГРАМАТА</p>
        <h2>Цялата Лятна програма за 0,50 €</h2>
        <p>Еднократно плащане. Без абонамент. Достъпът идва директно на имейл.</p>
        <button class="summer-primary-cta" type="button" data-summer-checkout data-primary-cta>
          Купи сега за 0,50 €
        </button>
        <p class="summer-checkout-status" data-summer-checkout-status aria-live="polite"></p>
      </section>

      <section id="summer-guarantee" class="summer-section">
        <p class="summer-eyebrow">ГАРАНЦИЯ И СИГУРНОСТ</p>
        <div class="summer-card-grid summer-guarantee-grid">
          <article>Сигурно плащане чрез Stripe</article>
          <article>Моментален достъп след покупка</article>
          <article>Без абонаменти и скрити такси</article>
          <article>Поддръжка при въпроси</article>
        </div>
      </section>

      <section id="summer-faq" class="summer-section">
        <p class="summer-eyebrow">ЧЕСТО ЗАДАВАНИ ВЪПРОСИ</p>
        <h2>Всичко важно преди покупката</h2>
        <details><summary>Как получавам достъп?</summary><p>След успешно плащане получаваш автоматичен имейл с линк за достъп до програмата.</p></details>
        <details><summary>Плащането еднократно ли е?</summary><p>Да. Няма абонамент или автоматично подновяване.</p></details>
        <details><summary>За каква възраст и ниво е подходяща?</summary><p>За футболисти, които могат да следват структурирани упражнения самостоятелно или с помощ от родител.</p></details>
        <details><summary>Може ли да се комбинира с клубни тренировки?</summary><p>Да, като допълнителната работа се съобразява с натоварването и програмата на клуба.</p></details>
        <details><summary>Какво да направя, ако не получа имейла?</summary><p>Провери папка Спам и пиши на become.pro2024@gmail.com.</p></details>
      </section>

      <section id="summer-final-cta" class="summer-final-cta">
        <p class="summer-eyebrow">ЗАПОЧНИ С ЯСЕН ПЛАН</p>
        <h2>Направи лятото част от развитието си</h2>
        <p>Вземи Лятната програма за 0,50 € и получи достъп веднага след успешно плащане.</p>
        <button class="summer-primary-cta" type="button" data-summer-checkout data-primary-cta>
          Вземи Лятната програма
        </button>
      </section>
    </main>

    <footer class="summer-footer">
      <a href="mailto:become.pro2024@gmail.com">become.pro2024@gmail.com</a>
      <nav aria-label="Правна информация">
        <a href="/privacy-policy">Поверителност</a>
        <a href="/terms">Общи условия</a>
        <a href="/cookie-policy">Бисквитки</a>
        <a href="/refund-policy">Възстановяване на суми</a>
      </nav>
    </footer>

    <div class="summer-mobile-sticky" data-mobile-sticky-cta>
      <div><strong>0,50 €</strong><span>Еднократно</span></div>
      <button type="button" data-summer-checkout data-primary-cta>Вземи програмата</button>
    </div>

    <script src="/summer-program.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Run the landing tests**

Expected: route and content tests PASS; CSS and JavaScript-specific tests are not yet present.

- [ ] **Step 5: Commit the page structure**

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add summer-program.html tests\summer-program-landing.test.js
& 'C:\Program Files\Git\cmd\git.exe' commit -m "Add summer program sales page structure"
```

### Task 3: Add the Black-and-Gold Mobile-First Presentation

**Files:**
- Create: `summer-program.css`
- Modify: `tests/summer-program-landing.test.js`

- [ ] **Step 1: Add failing CSS contract tests**

```js
test("summer program landing has isolated premium responsive styling", () => {
  const html = read("summer-program.html");
  const css = read("summer-program.css");

  assert.match(html, /summer-program\.css/);
  assert.match(css, /#050505|#060606/);
  assert.match(css, /#f5c400|245,\s*196,\s*0/);
  assert.match(css, /\.summer-mobile-sticky/);
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(css, /overflow-x:\s*hidden/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Expected: FAIL because `summer-program.css` does not exist.

- [ ] **Step 3: Create `summer-program.css`**

Implement these required tokens and component rules:

```css
:root {
  --summer-bg: #050505;
  --summer-panel: #0d0e0d;
  --summer-panel-soft: #14150f;
  --summer-gold: #f5c400;
  --summer-gold-soft: #fbe9a0;
  --summer-white: #f7f7f2;
  --summer-muted: #b9b9ae;
  --summer-line: rgba(245, 196, 0, 0.24);
  --summer-max: 1180px;
  --summer-radius: 20px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  background: var(--summer-bg);
}

body.summer-sales-page {
  margin: 0;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 80% 10%, rgba(245, 196, 0, 0.08), transparent 28%),
    var(--summer-bg);
  color: var(--summer-white);
  font-family: Arial, Helvetica, sans-serif;
}

.summer-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 72px;
  padding: 12px max(18px, calc((100vw - var(--summer-max)) / 2));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(5, 5, 5, 0.92);
  backdrop-filter: blur(16px);
}

.summer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--summer-white);
  font-weight: 900;
  text-decoration: none;
}

.summer-brand img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.summer-header-cta,
.summer-primary-cta,
.summer-mobile-sticky button {
  border: 1px solid var(--summer-gold);
  border-radius: 12px;
  background: var(--summer-gold);
  color: #050505;
  font-weight: 900;
  cursor: pointer;
}

.summer-hero,
.summer-section,
.summer-proof,
.summer-price-section,
.summer-final-cta,
.summer-footer {
  width: min(calc(100% - 36px), var(--summer-max));
  margin-inline: auto;
}

.summer-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.75fr);
  gap: clamp(28px, 6vw, 80px);
  align-items: center;
  min-height: calc(100vh - 72px);
  padding: clamp(52px, 8vw, 104px) 0;
}

.summer-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summer-card-grid article,
.summer-panel,
.summer-price-section,
.summer-final-cta {
  border: 1px solid var(--summer-line);
  border-radius: var(--summer-radius);
  background:
    linear-gradient(145deg, rgba(245, 196, 0, 0.065), transparent 70%),
    var(--summer-panel);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.32);
}

.summer-section {
  padding: clamp(56px, 8vw, 96px) 0;
}

.summer-mobile-sticky {
  display: none;
}

@media (max-width: 900px) {
  .summer-hero {
    grid-template-columns: 1fr;
  }

  .summer-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  body.summer-sales-page {
    padding-bottom: 82px;
  }

  .summer-header-cta {
    display: none;
  }

  .summer-hero,
  .summer-card-grid,
  .summer-proof {
    grid-template-columns: 1fr;
  }

  .summer-mobile-sticky {
    position: fixed;
    inset: auto 0 0;
    z-index: 30;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-top: 1px solid var(--summer-line);
    background: rgba(5, 5, 5, 0.96);
    backdrop-filter: blur(16px);
  }
}
```

Append these exact component rules:

```css
.summer-eyebrow {
  margin: 0 0 12px;
  color: var(--summer-gold);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.summer-hero h1,
.summer-section h2,
.summer-price-section h2,
.summer-final-cta h2 {
  margin: 0 0 18px;
  text-transform: uppercase;
  line-height: 1;
}

.summer-hero h1 {
  max-width: 760px;
  font-size: clamp(46px, 7vw, 82px);
}

.summer-section h2,
.summer-price-section h2,
.summer-final-cta h2 {
  max-width: 820px;
  font-size: clamp(34px, 5vw, 58px);
}

.summer-lead,
.summer-section > p,
.summer-price-section > p,
.summer-final-cta > p {
  max-width: 720px;
  color: var(--summer-muted);
  font-size: clamp(17px, 2vw, 21px);
  line-height: 1.65;
}

.summer-price-inline {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 28px 0 18px;
}

.summer-price-inline strong {
  color: var(--summer-gold);
  font-size: clamp(38px, 5vw, 60px);
}

.summer-price-inline span,
.summer-trust-line,
.summer-checkout-status {
  color: var(--summer-muted);
  font-size: 13px;
  font-weight: 700;
}

.summer-primary-cta {
  min-height: 56px;
  padding: 15px 24px;
  font-size: 16px;
  box-shadow: 0 16px 36px rgba(245, 196, 0, 0.16);
}

.summer-primary-cta:hover,
.summer-header-cta:hover,
.summer-mobile-sticky button:hover {
  background: var(--summer-gold-soft);
  transform: translateY(-1px);
}

.summer-primary-cta:focus-visible,
.summer-header-cta:focus-visible,
.summer-mobile-sticky button:focus-visible,
.summer-footer a:focus-visible,
.summer-brand:focus-visible {
  outline: 3px solid rgba(245, 196, 0, 0.4);
  outline-offset: 3px;
}

.summer-primary-cta:disabled,
.summer-header-cta:disabled,
.summer-mobile-sticky button:disabled {
  cursor: wait;
  opacity: 0.68;
  transform: none;
}

.summer-hero-media {
  position: relative;
  display: grid;
  place-items: center;
}

.summer-hero-media::before {
  content: "";
  position: absolute;
  width: 80%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(245, 196, 0, 0.15);
  filter: blur(70px);
}

.summer-hero-media img {
  position: relative;
  width: min(100%, 470px);
  max-height: 610px;
  object-fit: contain;
  filter: drop-shadow(0 34px 50px rgba(0, 0, 0, 0.48));
}

.summer-card-grid article {
  min-height: 180px;
  padding: 24px;
}

.summer-card-grid article > span {
  color: var(--summer-gold);
  font-size: 12px;
  font-weight: 900;
}

.summer-card-grid h3 {
  margin: 36px 0 10px;
  font-size: 21px;
}

.summer-card-grid p,
.summer-card-grid article {
  color: var(--summer-muted);
  line-height: 1.55;
}

.summer-panel,
.summer-price-section,
.summer-final-cta {
  padding: clamp(28px, 5vw, 60px);
}

.summer-included-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

.summer-included-list li {
  position: relative;
  padding: 17px 18px 17px 46px;
  border: 1px solid var(--summer-line);
  border-radius: 14px;
  background: var(--summer-panel);
  color: var(--summer-white);
  font-weight: 800;
}

.summer-included-list li::before {
  content: "✓";
  position: absolute;
  left: 18px;
  color: var(--summer-gold);
}

.summer-proof {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 18px 0 clamp(56px, 8vw, 96px);
}

.summer-proof article {
  padding: clamp(26px, 5vw, 48px);
  border: 1px solid var(--summer-line);
  border-radius: var(--summer-radius);
  background: var(--summer-panel);
  text-align: center;
}

.summer-proof strong {
  display: block;
  color: var(--summer-gold);
  font-size: clamp(46px, 7vw, 76px);
}

.summer-proof span {
  color: var(--summer-white);
  font-weight: 900;
  text-transform: uppercase;
}

.summer-price-section,
.summer-final-cta {
  margin-block: clamp(42px, 7vw, 84px);
  text-align: center;
}

.summer-price-section > *,
.summer-final-cta > * {
  margin-inline: auto;
}

.summer-guarantee-grid article {
  min-height: 120px;
  color: var(--summer-white);
  font-weight: 900;
}

#summer-faq details {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

#summer-faq summary {
  cursor: pointer;
  padding: 20px 0;
  color: var(--summer-white);
  font-weight: 900;
}

#summer-faq details p {
  max-width: 800px;
  padding: 0 0 20px;
  color: var(--summer-muted);
  line-height: 1.65;
}

.summer-footer {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 34px 0 110px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.summer-footer nav {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.summer-footer a {
  color: var(--summer-muted);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.summer-checkout-status:not(:empty) {
  margin-top: 14px;
  color: var(--summer-gold-soft);
}

@media (max-width: 720px) {
  .summer-header {
    min-height: 64px;
  }

  .summer-hero {
    min-height: auto;
    padding: 46px 0 64px;
  }

  .summer-hero h1 {
    font-size: clamp(42px, 13vw, 58px);
  }

  .summer-hero-media {
    order: -1;
  }

  .summer-hero-media img {
    max-height: 380px;
  }

  .summer-included-list,
  .summer-proof {
    grid-template-columns: 1fr;
  }

  .summer-price-inline {
    align-items: flex-start;
    flex-direction: column;
  }

  .summer-primary-cta {
    width: 100%;
  }

  .summer-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .summer-footer nav {
    flex-direction: column;
  }

  .summer-mobile-sticky strong,
  .summer-mobile-sticky span {
    display: block;
  }

  .summer-mobile-sticky strong {
    color: var(--summer-gold);
    font-size: 20px;
  }

  .summer-mobile-sticky span {
    color: var(--summer-muted);
    font-size: 11px;
  }

  .summer-mobile-sticky button {
    min-height: 48px;
    padding: 12px 16px;
  }
}
```

- [ ] **Step 4: Run tests**

Expected: the CSS contract test PASS.

- [ ] **Step 5: Render local desktop and mobile screenshots**

Use the existing local static server at `http://127.0.0.1:4173/summer-program` and Playwright with:

- Desktop: `1440x900`
- iPhone: `390x844`
- Android: `412x915`

Verify:

```js
document.body.scrollWidth === window.innerWidth
```

Expected: true at all three viewports.

- [ ] **Step 6: Commit the responsive design**

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add summer-program.css tests\summer-program-landing.test.js
& 'C:\Program Files\Git\cmd\git.exe' commit -m "Style summer program sales landing"
```

### Task 4: Implement Anonymous Funnel and Section Tracking

**Files:**
- Create: `summer-program.js`
- Modify: `api/landing-analytics.js`
- Modify: `supabase/schema.sql`
- Modify: `tests/summer-program-landing.test.js`

- [ ] **Step 1: Add failing tracker tests**

```js
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

  assert.match(script, /pageVariant:\s*"summer-program"/);
  assert.match(script, /sessionStorage/);
  assert.match(script, /crypto\.randomUUID/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /\/api\/landing-analytics/);
  assert.doesNotMatch(script, /analyticsPayload[\s\S]{0,900}\b(name|phone|email)\s*:/);
});

test("analytics API accepts summer funnel events but reserves purchases for the webhook", () => {
  const endpoint = read("api/landing-analytics.js");

  ["scroll_25", "scroll_75", "view_problem", "view_solution", "view_program_contents", "view_price",
    "checkout_started", "checkout_created", "checkout_error"].forEach((eventName) => {
    assert.match(endpoint, new RegExp(eventName));
  });

  assert.doesNotMatch(endpoint.match(/const EVENT_NAMES[\s\S]*?\]\);/)?.[0] || "", /purchase_completed/);
});
```

- [ ] **Step 2: Run and verify failures**

Expected: FAIL because the new script and events do not exist.

- [ ] **Step 3: Extend the public analytics allowlist**

Change `EVENT_NAMES` in `api/landing-analytics.js` to:

```js
const EVENT_NAMES = new Set([
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
  "click_secondary_cta",
  "form_start",
  "form_submit_success",
  "form_submit_error",
  "checkout_started",
  "checkout_created",
  "checkout_error",
]);
```

Do not add `purchase_completed` to this public allowlist.

- [ ] **Step 4: Extend the database event constraint**

In `supabase/schema.sql`, add explicit migration statements:

```sql
alter table public.landing_analytics_events
  drop constraint if exists landing_analytics_events_event_name_check;

alter table public.landing_analytics_events
  add constraint landing_analytics_events_event_name_check
  check (
    event_name in (
      'page_view',
      'scroll_25',
      'scroll_50',
      'scroll_75',
      'scroll_90',
      'view_problem',
      'view_solution',
      'view_program_contents',
      'view_price',
      'click_primary_cta',
      'click_secondary_cta',
      'form_start',
      'form_submit_success',
      'form_submit_error',
      'checkout_started',
      'checkout_created',
      'checkout_error',
      'purchase_completed'
    )
  );
```

Also update the original `create table` constraint to the same list so fresh databases and migrated databases match.

- [ ] **Step 5: Create `summer-program.js` tracking core**

Implement:

```js
(() => {
  const EVENT_NAMES = new Set([
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
  ]);
  const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const params = new URLSearchParams(window.location.search);
  const campaign = Object.fromEntries(
    CAMPAIGN_KEYS.map((key) => [key, (params.get(key) || "").slice(0, 160)]),
  );
  const landingPageUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const pageVariant = "summer-program";
  const referrer = document.referrer.slice(0, 500);
  const deviceType = window.matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop";
  const SESSION_KEY = "bp_summer_program_session_id";
  const sessionId =
    sessionStorage.getItem(SESSION_KEY) ||
    (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  sessionStorage.setItem(SESSION_KEY, sessionId);

  const onceKey = (eventName) => `bp_summer_once:${sessionId}:${eventName}`;
  const track = (eventName, once = false) => {
    if (!EVENT_NAMES.has(eventName) || (once && sessionStorage.getItem(onceKey(eventName)))) return;
    if (once) sessionStorage.setItem(onceKey(eventName), "1");

    const body = JSON.stringify({
      sessionId,
      landingPageUrl,
      pageVariant,
      eventName,
      ...campaign,
      referrer,
      deviceType,
    });
    let sent = false;
    if (navigator.sendBeacon) {
      sent = navigator.sendBeacon("/api/landing-analytics", new Blob([body], { type: "application/json" }));
    }
    if (!sent) {
      fetch("/api/landing-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  };

  track("page_view", true);

  const scrollEvents = [
    [0.25, "scroll_25"],
    [0.5, "scroll_50"],
    [0.75, "scroll_75"],
    [0.9, "scroll_90"],
  ];
  window.addEventListener("scroll", () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const depth = window.scrollY / scrollable;
    scrollEvents.forEach(([threshold, eventName]) => {
      if (depth >= threshold) track(eventName, true);
    });
  }, { passive: true });

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target.dataset.trackView) {
        track(entry.target.dataset.trackView, true);
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.45 },
  );
  document.querySelectorAll("[data-track-view]").forEach((section) => observer.observe(section));

  window.summerProgramAnalytics = { sessionId, landingPageUrl, pageVariant, campaign, referrer, deviceType, track };
})();
```

- [ ] **Step 6: Run analytics tests**

Expected: PASS for tracker allowlist, no-personal-data, and public purchase-event rejection.

- [ ] **Step 7: Commit tracking**

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add summer-program.js api\landing-analytics.js supabase\schema.sql tests\summer-program-landing.test.js
& 'C:\Program Files\Git\cmd\git.exe' commit -m "Track summer program landing funnel"
```

### Task 5: Add Direct Checkout with Anonymous Attribution

**Files:**
- Modify: `summer-program.js`
- Modify: `api/create-checkout-session.js`
- Modify: `api/_shared.js`
- Modify: `tests/summer-program-landing.test.js`
- Modify: `tests/checkout-flow.test.js`

- [ ] **Step 1: Add failing checkout-attribution tests**

```js
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

  ["landingSessionId", "landingPageUrl", "pageVariant", "utm_source", "utm_medium", "utm_campaign",
    "utm_content", "utm_term", "referrer", "deviceType"].forEach((field) => {
    assert.match(`${endpoint}\n${shared}`, new RegExp(field));
  });
  assert.match(shared, /metadata\[landingSessionId\]/);
  assert.match(shared, /payment_intent_data\[metadata\]\[landingSessionId\]/);
});
```

- [ ] **Step 2: Run and verify failures**

Expected: FAIL because checkout attribution is not accepted or copied.

- [ ] **Step 3: Sanitize attribution in `api/create-checkout-session.js`**

Add:

```js
const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);
```

After reading `body`, create:

```js
const attribution = body.attribution || {};
const checkoutAttribution = {
  landingSessionId: cleanText(attribution.sessionId, 100),
  landingPageUrl: cleanText(attribution.landingPageUrl, 500),
  pageVariant: cleanText(attribution.pageVariant, 160),
  utm_source: cleanText(attribution.utm_source, 160),
  utm_medium: cleanText(attribution.utm_medium, 160),
  utm_campaign: cleanText(attribution.utm_campaign, 160),
  utm_content: cleanText(attribution.utm_content, 160),
  utm_term: cleanText(attribution.utm_term, 160),
  referrer: cleanText(attribution.referrer, 500),
  deviceType: cleanText(attribution.deviceType, 40),
};
```

Pass it into:

```js
const session = await createStripeCheckoutSession({
  programs,
  customer,
  origin: getOrigin(req),
  attribution: checkoutAttribution,
});
```

- [ ] **Step 4: Copy attribution into Stripe metadata in `api/_shared.js`**

Change the function signature:

```js
const createStripeCheckoutSession = async ({ programs, customer, origin, attribution = {} }) => {
```

Add these keys to `metadata`:

```js
landingSessionId: attribution.landingSessionId || "",
landingPageUrl: attribution.landingPageUrl || "",
pageVariant: attribution.pageVariant || "",
utm_source: attribution.utm_source || "",
utm_medium: attribution.utm_medium || "",
utm_campaign: attribution.utm_campaign || "",
utm_content: attribution.utm_content || "",
utm_term: attribution.utm_term || "",
referrer: attribution.referrer || "",
deviceType: attribution.deviceType || "",
```

The existing `Object.entries(metadata)` loop will copy them to both Checkout Session and PaymentIntent metadata.

- [ ] **Step 5: Add direct checkout behavior in `summer-program.js`**

Append inside the IIFE:

```js
const checkoutButtons = [...document.querySelectorAll("[data-summer-checkout]")];
const checkoutStatus = document.querySelector("[data-summer-checkout-status]");
let checkoutPending = false;

const setCheckoutPending = (pending) => {
  checkoutPending = pending;
  checkoutButtons.forEach((button) => {
    button.disabled = pending;
    button.setAttribute("aria-busy", String(pending));
    if (pending) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Отваряме Stripe...";
    } else if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  });
};

const startCheckout = async () => {
  if (checkoutPending) return;
  window.summerProgramAnalytics.track("click_primary_cta");
  window.summerProgramAnalytics.track("checkout_started");
  setCheckoutPending(true);
  if (checkoutStatus) checkoutStatus.textContent = "Подготвяме сигурното плащане...";

  try {
    const analytics = window.summerProgramAnalytics;
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: ["summer-program"],
        attribution: {
          sessionId: analytics.sessionId,
          landingPageUrl: analytics.landingPageUrl,
          pageVariant: analytics.pageVariant,
          ...analytics.campaign,
          referrer: analytics.referrer,
          deviceType: analytics.deviceType,
        },
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.error || "Не успяхме да отворим плащането.");
    window.summerProgramAnalytics.track("checkout_created");
    window.location.href = data.url;
  } catch (error) {
    window.summerProgramAnalytics.track("checkout_error");
    if (checkoutStatus) {
      checkoutStatus.textContent = error.message || "Плащането не се отвори. Моля, опитай отново.";
    }
    setCheckoutPending(false);
  }
};

checkoutButtons.forEach((button) => button.addEventListener("click", startCheckout));
```

- [ ] **Step 6: Run tests**

Expected: checkout attribution and direct-product tests PASS; all existing checkout tests remain PASS.

- [ ] **Step 7: Commit direct checkout**

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add summer-program.js api\create-checkout-session.js api\_shared.js tests\summer-program-landing.test.js tests\checkout-flow.test.js
& 'C:\Program Files\Git\cmd\git.exe' commit -m "Add attributed summer program checkout"
```

### Task 6: Record Verified and Idempotent Purchases from Stripe

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `api/stripe/webhook.js`
- Modify: `tests/summer-program-landing.test.js`
- Modify: `tests/checkout-flow.test.js`

- [ ] **Step 1: Add failing webhook-only purchase tests**

```js
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
```

- [ ] **Step 2: Run and verify failure**

Expected: FAIL because purchase analytics columns/index and webhook insert do not exist.

- [ ] **Step 3: Add commerce columns and unique index**

Add to `supabase/schema.sql`:

```sql
alter table public.landing_analytics_events
  add column if not exists stripe_checkout_session_id text;

alter table public.landing_analytics_events
  add column if not exists program_id text;

create unique index if not exists landing_analytics_purchase_session_idx
  on public.landing_analytics_events (stripe_checkout_session_id, program_id, event_name);
```

Also include the two nullable columns in the original table definition.

- [ ] **Step 4: Add a webhook helper**

In `api/stripe/webhook.js`, add:

```js
const trackCompletedPurchase = async ({ session, programs, origin }) => {
  if (!hasSupabaseAdmin()) return;
  const metadata = session.metadata || {};
  const summerProgram = programs.find((program) => program.id === "summer-program");
  if (!summerProgram || metadata.pageVariant !== "summer-program") return;

  await supabaseRequest("landing_analytics_events?on_conflict=stripe_checkout_session_id,program_id,event_name", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([
      {
        session_id: metadata.landingSessionId || `stripe-${session.id}`,
        landing_page_url: metadata.landingPageUrl || `${origin}/summer-program`,
        page_variant: "summer-program",
        event_name: "purchase_completed",
        utm_source: metadata.utm_source || null,
        utm_medium: metadata.utm_medium || null,
        utm_campaign: metadata.utm_campaign || null,
        utm_content: metadata.utm_content || null,
        utm_term: metadata.utm_term || null,
        referrer: metadata.referrer || null,
        device_type: metadata.deviceType || "unknown",
        stripe_checkout_session_id: session.id,
        program_id: summerProgram.id,
      },
    ]),
  });
};
```

- [ ] **Step 5: Call the helper only after signature verification and product resolution**

Inside `checkout.session.completed`, after the paid order persistence attempt and before fulfillment email:

```js
try {
  await trackCompletedPurchase({
    session,
    programs,
    origin: getOrigin(req),
  });
} catch (analyticsError) {
  console.error("Purchase analytics failed:", analyticsError);
  await logAdminEvent({
    level: "error",
    event: "purchase_analytics_failed",
    message: "Paid Summer Program order could not be added to landing analytics.",
    stripeSessionId: session.id,
    metadata: { programIds: programs.map((program) => program.id), error: analyticsError.message },
  });
}
```

Analytics failure must not block fulfillment.

- [ ] **Step 6: Confirm imports**

Ensure `api/stripe/webhook.js` imports these existing exports from `api/_shared.js`:

```js
getOrigin,
hasSupabaseAdmin,
logAdminEvent,
supabaseRequest,
```

Do not create a new API Function.

- [ ] **Step 7: Run checkout and landing tests**

Expected: purchase-event tests PASS and all fulfillment safeguards remain PASS.

- [ ] **Step 8: Commit webhook purchase tracking**

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add supabase\schema.sql api\stripe\webhook.js tests\summer-program-landing.test.js tests\checkout-flow.test.js
& 'C:\Program Files\Git\cmd\git.exe' commit -m "Track verified summer program purchases"
```

### Task 7: Expand the Admin Funnel for Commerce

**Files:**
- Modify: `api/admin/landing-analytics.js`
- Modify: `admin-orders.html`
- Modify: `admin-orders.js`
- Modify: `styles.css`
- Modify: `tests/summer-program-landing.test.js`
- Modify: `tests/individual-training-landing.test.js`

- [ ] **Step 1: Add failing commerce funnel tests**

```js
test("admin analytics exposes checkout and purchase metrics", () => {
  const endpoint = read("api/admin/landing-analytics.js");
  const html = read("admin-orders.html");
  const script = read("admin-orders.js");

  ["checkoutStarts", "checkoutsCreated", "purchases", "purchaseConversionRate"].forEach((field) => {
    assert.match(endpoint, new RegExp(field));
    assert.match(script, new RegExp(field));
  });
  assert.match(html, /Checkout Starts/);
  assert.match(html, /Purchases/);
  assert.match(html, /Purchase Conversion/);
});
```

- [ ] **Step 2: Run and verify failure**

Expected: FAIL because commerce metrics are absent.

- [ ] **Step 3: Extend `buildStats`**

Add counters:

```js
const purchaseSessions = new Set();
let checkoutStarts = 0;
let checkoutsCreated = 0;
let purchases = 0;
let checkoutErrors = 0;
```

Add event handling:

```js
if (event.event_name === "checkout_started") checkoutStarts += 1;
if (event.event_name === "checkout_created") checkoutsCreated += 1;
if (event.event_name === "checkout_error") checkoutErrors += 1;
if (event.event_name === "purchase_completed") {
  purchases += 1;
  purchaseSessions.add(event.session_id);
}
```

Return:

```js
purchaseConversionRate: pageViewSessions.size
  ? Number(((purchaseSessions.size / pageViewSessions.size) * 100).toFixed(2))
  : 0,
checkoutStarts,
checkoutsCreated,
checkoutErrors,
purchases,
```

Keep all existing training-form metrics unchanged.

- [ ] **Step 4: Select commerce columns**

Change the Supabase `select` parameter to:

```js
select: "session_id,event_name,landing_page_url,page_variant,utm_source,utm_medium,utm_campaign,event_time,stripe_checkout_session_id,program_id",
```

- [ ] **Step 5: Expand the admin markup**

Change the funnel table header in `admin-orders.html` to:

```html
<tr>
  <th>Landing page</th>
  <th>Page Views</th>
  <th>CTA Clicks</th>
  <th>Form Starts</th>
  <th>Form Submits</th>
  <th>Checkout Starts</th>
  <th>Purchases</th>
  <th>Lead Conversion</th>
  <th>Purchase Conversion</th>
</tr>
```

- [ ] **Step 6: Render commerce summary cards and rows**

Add summary cards in `renderLandingAnalytics()`:

```js
["Checkout starts", summary.checkoutStarts || 0],
["Checkouts created", summary.checkoutsCreated || 0],
["Purchases", summary.purchases || 0],
["Purchase conversion", `${Number(summary.purchaseConversionRate || 0).toFixed(2)}%`],
```

Add corresponding cells in `analyticsFunnelRows()`:

```js
<td>${escapeHtml(row.checkoutStarts || 0)}</td>
<td>${escapeHtml(row.purchases || 0)}</td>
<td>${escapeHtml(`${Number(row.conversionRate || 0).toFixed(2)}%`)}</td>
<td>${escapeHtml(`${Number(row.purchaseConversionRate || 0).toFixed(2)}%`)}</td>
```

- [ ] **Step 7: Adjust admin table width**

In `styles.css`, set:

```css
.admin-funnel-table {
  min-width: 1180px;
}
```

Keep the existing horizontal table wrapper for mobile.

- [ ] **Step 8: Run admin and landing tests**

Expected: both training-form and Summer Program commerce analytics tests PASS.

- [ ] **Step 9: Commit admin commerce analytics**

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add api\admin\landing-analytics.js admin-orders.html admin-orders.js styles.css tests\summer-program-landing.test.js tests\individual-training-landing.test.js
& 'C:\Program Files\Git\cmd\git.exe' commit -m "Show summer checkout funnel in admin analytics"
```

### Task 8: Apply and Verify the Supabase Migration

**Files:**
- Verify: `supabase/schema.sql`

- [ ] **Step 1: Run the complete automated suite before migration**

```powershell
& 'C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\*.test.js
```

Expected: all tests PASS.

- [ ] **Step 2: Confirm the Vercel Function count**

```powershell
$count = (Get-ChildItem api -Recurse -Filter *.js | Where-Object { $_.Name -ne '_shared.js' } | Measure-Object).Count
Write-Output $count
```

Expected: `12`.

- [ ] **Step 3: Execute the analytics migration in Supabase**

Open project `uyfysxiiaxqaqwqhyxfn` in Supabase SQL Editor and run the `landing_analytics_events` constraint/column/index portion of `supabase/schema.sql`.

The executed SQL must include:

```sql
alter table public.landing_analytics_events
  add column if not exists stripe_checkout_session_id text;

alter table public.landing_analytics_events
  add column if not exists program_id text;

create unique index if not exists landing_analytics_purchase_session_idx
  on public.landing_analytics_events (stripe_checkout_session_id, program_id, event_name);
```

and the updated event-name check constraint.

- [ ] **Step 4: Verify the migration**

Run in Supabase:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'landing_analytics_events'
order by ordinal_position;

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'landing_analytics_events'
order by indexname;
```

Expected:

- `stripe_checkout_session_id`
- `program_id`
- `landing_analytics_purchase_session_idx`

- [ ] **Step 5: Do not commit environment or SQL-editor output**

Confirm:

```powershell
& 'C:\Program Files\Git\cmd\git.exe' status --short
```

Expected: no untracked credential or environment files.

### Task 9: Local End-to-End Browser QA

**Files:**
- Verify: `summer-program.html`
- Verify: `summer-program.css`
- Verify: `summer-program.js`

- [ ] **Step 1: Start or confirm the local server**

Use:

```text
http://127.0.0.1:4173/summer-program?utm_source=instagram&utm_medium=paid_social&utm_campaign=summer_launch
```

- [ ] **Step 2: Verify page identity and isolation**

Check:

- title is `Лятна футболна програма | Become Pro`
- no standard menu
- no cart
- no links to other programs
- all visible purchase buttons contain Summer Program language

- [ ] **Step 3: Verify desktop rendering**

Viewport: `1440x900`.

Check:

- hero content and cover are visible above the fold
- all section cards align
- price is visible
- final CTA appears before footer
- `document.body.scrollWidth === window.innerWidth`
- console has no errors or warnings

Save screenshot outside committed source:

```text
.codex-tools/summer-program-local-desktop.png
```

- [ ] **Step 4: Verify iPhone rendering**

Viewport: `390x844`.

Check:

- sticky CTA is fixed and does not cover footer content permanently
- button tap target is at least 44px high
- no horizontal scroll
- program cover is not clipped
- FAQ details open and close

Save:

```text
.codex-tools/summer-program-local-iphone.png
```

- [ ] **Step 5: Verify Android rendering**

Viewport: `412x915`.

Repeat the mobile checks and save:

```text
.codex-tools/summer-program-local-android.png
```

- [ ] **Step 6: Verify browser events**

Intercept `/api/landing-analytics` requests and confirm payloads for:

- page load: `page_view`
- 25%, 50%, 75%, and 90% scroll
- problem section: `view_problem`
- solution section: `view_solution`
- contents section: `view_program_contents`
- price section: `view_price`
- CTA: `click_primary_cta`, then `checkout_started`

Confirm payload:

```json
{
  "pageVariant": "summer-program",
  "utm_source": "instagram",
  "utm_medium": "paid_social",
  "utm_campaign": "summer_launch"
}
```

and confirm it contains no name, email, phone, or IP field.

- [ ] **Step 7: Verify checkout request without navigating away**

Intercept `/api/create-checkout-session` and confirm:

```json
{
  "items": ["summer-program"],
  "attribution": {
    "pageVariant": "summer-program",
    "utm_source": "instagram",
    "utm_medium": "paid_social",
    "utm_campaign": "summer_launch"
  }
}
```

- [ ] **Step 8: Commit any QA fixes**

If QA required edits, rerun all tests and commit only the fixes:

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add summer-program.html summer-program.css summer-program.js
& 'C:\Program Files\Git\cmd\git.exe' commit -m "Polish summer program landing QA"
```

### Task 10: Production Deploy and Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run final verification**

```powershell
& 'C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests\*.test.js
& 'C:\Program Files\Git\cmd\git.exe' diff --check
& 'C:\Program Files\Git\cmd\git.exe' status --short
```

Expected:

- all tests PASS
- no whitespace errors
- only intentional changes remain

- [ ] **Step 2: Push `main`**

```powershell
& 'C:\Program Files\Git\cmd\git.exe' push origin main
```

- [ ] **Step 3: Confirm Vercel deployment**

In the Vercel project `112233dds-projects/become-pro`, verify:

- source commit matches local `HEAD`
- environment is Production
- status is `Ready`
- no Hobby function-limit error

- [ ] **Step 4: Verify the production page**

Open:

```text
https://become-pro-ivory.vercel.app/summer-program?utm_source=instagram&utm_medium=paid_social&utm_campaign=production_qa
```

Confirm:

- dedicated page loads
- existing `https://become-pro-ivory.vercel.app/programs/summer-program` still loads the product detail
- desktop, iPhone, and Android layouts match approved screenshots
- no console errors
- no broken images
- no horizontal scroll

- [ ] **Step 5: Verify real Stripe Checkout creation**

Click the production CTA and confirm:

- `/api/create-checkout-session` returns `200`
- Checkout Session contains only `summer-program`
- Stripe page shows `0,50 €`
- metadata includes `landingSessionId`, `pageVariant=summer-program`, and production QA UTM values

Cancel the session if no paid test has been authorized.

- [ ] **Step 6: Complete the purchase verification checkpoint**

Because `purchase_completed` must originate from a genuine successful Stripe event, complete one `0,50 €` payment only with the user's explicit approval at execution time.

After payment, verify:

- Stripe payment is visible
- order is `paid` in admin
- fulfillment email contains the correct Summer Program Drive link
- `landing_analytics_events` has exactly one `purchase_completed` row for the Stripe session
- replaying the webhook does not create a duplicate row
- admin analytics shows one purchase for `production_qa`

- [ ] **Step 7: Scan production runtime errors**

Check Vercel Logs for the deployment and confirm:

- no checkout exceptions
- no webhook signature errors from the completed test
- no purchase analytics insert errors
- no fulfillment email errors

- [ ] **Step 8: Send the final QA report**

Report:

- production URL
- deployment commit and Ready status
- desktop/iPhone/Android results
- working browser events
- checkout session verification
- purchase/webhook verification status
- Supabase rows and admin dashboard visibility
- any remaining dependency on a user-completed payment

Include production desktop and mobile screenshots at the end.
