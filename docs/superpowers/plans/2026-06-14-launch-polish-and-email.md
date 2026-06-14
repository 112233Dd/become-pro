# Become Pro Launch Polish and Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the final purchase-trust, legal, footer, and post-purchase email improvements, deploy them, and verify the complete production flow.

**Architecture:** Keep the existing static HTML, CSS, vanilla JavaScript, Vercel Functions, Stripe, and Supabase architecture. Public pages will share a footer rendered by `script.js`, product trust content will be rendered from the existing storefront/detail paths, and the fulfillment service will send multipart UTF-8 email with both HTML and plain-text bodies while preserving `delivery_failed` safeguards.

**Tech Stack:** Static HTML5, CSS, vanilla JavaScript, Node.js Vercel Functions, Stripe Checkout/webhooks, Supabase REST, SMTP/Resend, Node test runner.

---

## File Structure

- Modify `index.html`: replace the existing three hero statistics with the four approved statistics.
- Modify `programs.html`: add a mount point for the storefront trust section and replace the hard-coded footer with a shared mount.
- Modify all public top-level HTML files: replace page-specific footer content with a shared footer mount.
- Modify `programs/*/index.html`: keep product detail mounts and replace page-specific footer content with a shared footer mount.
- Modify `script.js`: render the shared public footer using root-relative links.
- Modify `shop.js`: render the approved trust section on the storefront and all product detail pages.
- Modify `styles.css`: style hero statistics, trust cards, shared footer, legal content, and responsive states.
- Create `privacy-policy.html`, `terms.html`, `cookie-policy.html`, `refund-policy.html`: Bulgarian legal pages using the existing public header and shared footer.
- Modify `vercel.json`: expose clean legal routes.
- Modify `api/_shared.js`: support multipart UTF-8 SMTP email and HTML Resend payloads.
- Modify `api/stripe/webhook.js`: build the professional customer HTML email, correct Bulgarian plain-text email, remove Viber content, and preserve fulfillment failure handling.
- Modify `tests/checkout-flow.test.js`: test HTML email, UTF-8 MIME, absence of Viber content, and existing fulfillment safety.
- Modify `tests/production-launch.test.js`: test hero stats, trust content, shared footer, public-page mounts, legal pages, and legal routes.

### Task 1: Lock the Public UI Requirements with Tests

**Files:**
- Modify: `tests/production-launch.test.js`

- [ ] **Step 1: Add failing tests for the four homepage statistics**

Add a test that reads `index.html` and requires:

```js
test("homepage hero shows the four approved launch statistics", () => {
  const html = read("index.html");

  assert.match(html, /<strong>50\+<\/strong><span>футболисти<\/span>/);
  assert.match(html, /<strong>100\+<\/strong><span>проведени тренировки<\/span>/);
  assert.match(html, /<strong>4\+<\/strong><span>футболни програми<\/span>/);
  assert.match(html, /<strong>10[–-]24<\/strong><span>години подходяща възраст<\/span>/);
});
```

- [ ] **Step 2: Add failing tests for storefront and detail trust content**

Require all four approved trust statements in `shop.js`, require a `data-purchase-trust` mount after `data-program-storefront` in `programs.html`, and require the product detail renderer to include the trust renderer:

```js
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
```

- [ ] **Step 3: Add failing tests for shared footer mounts**

Define the public top-level and nested page lists and assert each page has exactly one `data-site-footer` mount and loads `script.js`. Also assert `script.js` contains the required contact and legal destinations:

```js
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
    "training.html",
    "privacy-policy.html",
    "terms.html",
    "cookie-policy.html",
    "refund-policy.html",
    "programs/technical-pack/index.html",
    "programs/strength-level-1/index.html",
    "programs/strength-level-2/index.html",
    "programs/strength-level-3/index.html",
    "programs/summer-program/index.html",
    "programs/matchday-pack/index.html",
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
```

- [ ] **Step 4: Add failing tests for legal files and rewrites**

Parse `vercel.json`, assert all four route destinations, and require the expected Bulgarian headings, contact email, last-updated element, shared header, and footer mount in each legal page.

- [ ] **Step 5: Run the public launch tests and confirm failure**

Run:

```powershell
node --test tests/production-launch.test.js
```

Expected: failures for the missing fourth stat, trust section, shared footer mounts, legal files, and legal rewrites.

- [ ] **Step 6: Commit the test contract**

```powershell
git add tests/production-launch.test.js
git commit -m "test: define launch polish requirements"
```

### Task 2: Implement Hero Statistics and Purchase Trust

**Files:**
- Modify: `index.html`
- Modify: `programs.html`
- Modify: `shop.js`
- Modify: `styles.css`
- Test: `tests/production-launch.test.js`

- [ ] **Step 1: Replace the hero statistics markup**

Use exactly:

```html
<div class="hero-stats" aria-label="Become Pro в числа">
  <div><strong>50+</strong><span>футболисти</span></div>
  <div><strong>100+</strong><span>проведени тренировки</span></div>
  <div><strong>4+</strong><span>футболни програми</span></div>
  <div><strong>10–24</strong><span>години подходяща възраст</span></div>
</div>
```

- [ ] **Step 2: Add the storefront trust mount**

Immediately after the `data-program-storefront` element in `programs.html`, add:

```html
<div data-purchase-trust></div>
```

- [ ] **Step 3: Add one reusable trust renderer**

In `shop.js`, add:

```js
const purchaseTrustItems = [
  ["secure", "Сигурно плащане чрез Stripe"],
  ["instant", "Моментален достъп след успешна покупка"],
  ["email", "Получаваш програмата директно на имейл"],
  ["support", "Поддръжка при проблем с достъпа"],
];

const renderPurchaseTrustMarkup = () => `
  <section class="purchase-trust" aria-label="Сигурност и достъп">
    ${purchaseTrustItems
      .map(
        ([icon, text]) => `
          <div class="purchase-trust-item">
            <span class="purchase-trust-icon purchase-trust-icon-${icon}" aria-hidden="true"></span>
            <span>${text}</span>
          </div>`,
      )
      .join("")}
  </section>`;

const renderPurchaseTrust = () => {
  document.querySelectorAll("[data-purchase-trust]").forEach((root) => {
    root.innerHTML = renderPurchaseTrustMarkup();
  });
};
```

Call `renderPurchaseTrust()` during shop initialization. Insert `${renderPurchaseTrustMarkup()}` in the product detail template after the primary purchase section and before related programs.

- [ ] **Step 4: Style the statistics and trust cards**

Keep the existing colors and add a four-column desktop stats grid, compact gold borders, and a two-column mobile grid. Add `.purchase-trust` as four equal desktop cards, two columns on tablets, and one column on narrow screens. CSS icons must remain decorative and must not rely on external assets.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
node --test tests/production-launch.test.js tests/checkout-flow.test.js tests/hero-video.test.js
```

Expected: hero and trust tests pass; all existing product and hero-video tests remain green.

- [ ] **Step 6: Commit**

```powershell
git add index.html programs.html shop.js styles.css tests/production-launch.test.js
git commit -m "feat: add launch statistics and purchase trust"
```

### Task 3: Build the Shared Footer and Legal Pages

**Files:**
- Modify: `script.js`
- Modify: `styles.css`
- Modify: `index.html`
- Modify: `programs.html`
- Modify: `cart.html`
- Modify: `checkout.html`
- Modify: `coach.html`
- Modify: `contact.html`
- Modify: `faq.html`
- Modify: `players.html`
- Modify: `training.html`
- Modify: `programs/technical-pack/index.html`
- Modify: `programs/strength-level-1/index.html`
- Modify: `programs/strength-level-2/index.html`
- Modify: `programs/strength-level-3/index.html`
- Modify: `programs/summer-program/index.html`
- Modify: `programs/matchday-pack/index.html`
- Create: `privacy-policy.html`
- Create: `terms.html`
- Create: `cookie-policy.html`
- Create: `refund-policy.html`
- Modify: `vercel.json`
- Test: `tests/production-launch.test.js`

- [ ] **Step 1: Replace public footer bodies with one mount**

On every public page, replace the current footer content with:

```html
<footer class="site-footer" data-site-footer></footer>
```

Do not change `admin-login.html` or `admin-orders.html`.

- [ ] **Step 2: Render the shared footer from `script.js`**

Add a `renderSiteFooter()` function that targets `[data-site-footer]` and inserts:

```html
<div class="footer-main">
  <div class="footer-brand">
    <a class="footer-logo" href="/" aria-label="Become Pro начало">BECOME <span>PRO</span></a>
    <p>Футболни програми и индивидуални тренировки за целенасочено развитие.</p>
  </div>
  <nav class="footer-column" aria-label="Бързи връзки">
    <h2>Навигация</h2>
    <a href="/programs">Програми</a>
    <a href="/training">Индивидуални тренировки</a>
    <a href="/players">Играчи</a>
    <a href="/faq">FAQ</a>
    <a href="/contact">Контакти</a>
  </nav>
  <div class="footer-column">
    <h2>Свържи се с нас</h2>
    <a href="https://www.instagram.com/yordan.zhelew1/" target="_blank" rel="noreferrer">Instagram</a>
    <a href="https://www.tiktok.com/@yordan.zhelew1?lang=en" target="_blank" rel="noreferrer">TikTok</a>
    <a href="mailto:become.pro2024@gmail.com">become.pro2024@gmail.com</a>
    <a href="tel:+359897575257">+359 897 575 257</a>
  </div>
  <nav class="footer-column" aria-label="Правна информация">
    <h2>Правна информация</h2>
    <a href="/privacy-policy">Политика за поверителност</a>
    <a href="/terms">Общи условия</a>
    <a href="/cookie-policy">Политика за бисквитки</a>
    <a href="/refund-policy">Възстановяване на суми</a>
  </nav>
</div>
<div class="footer-bottom">
  <p>© ${new Date().getFullYear()} Become Pro. Всички права запазени.</p>
</div>
```

Use root-relative public links. Use the site's actual Instagram and TikTok profile URLs already present in existing footer markup; use `mailto:become.pro2024@gmail.com` and `tel:+359897575257`.

- [ ] **Step 3: Create a consistent legal-page shell**

Each legal page must use the existing header/navigation pattern, include:

```html
<main class="legal-page">
  <article class="legal-card">
    <p class="eyebrow">Правна информация</p>
    <h1>Политика за поверителност</h1>
    <p class="legal-updated">Последна актуализация: 14 юни 2026 г.</p>
    <section>
      <h2>Какви данни събираме</h2>
      <p>Описанието за конкретната legal страница се добавя в отделните стъпки по-долу.</p>
    </section>
  </article>
</main>
<footer class="site-footer" data-site-footer></footer>
<script src="script.js"></script>
```

- [ ] **Step 4: Write the privacy policy**

Include clear Bulgarian sections for collected purchase/training data, processing purposes, Stripe/Vercel/Supabase/email providers, retention, security, data-subject rights, and contact at `become.pro2024@gmail.com`.

- [ ] **Step 5: Write the terms**

Include merchant/contact information, digital program ordering, Stripe payment, immediate email delivery, personal non-transferable license, redistribution prohibition, customer responsibilities, support, availability, and Bulgarian law.

- [ ] **Step 6: Write the cookie policy**

Describe only currently used mechanisms: essential site storage, cart `localStorage`, admin authentication cookie, and third-party services needed for payment/hosting. State browser controls without claiming optional analytics or marketing cookies exist.

- [ ] **Step 7: Write the refund policy**

Explain immediate digital delivery, reviewable cases for missing access, invalid link, or duplicate payment, the email request procedure, required payment details, and refunds through the original payment method.

- [ ] **Step 8: Add clean legal rewrites**

Add:

```json
{ "source": "/privacy-policy", "destination": "/privacy-policy.html" },
{ "source": "/terms", "destination": "/terms.html" },
{ "source": "/cookie-policy", "destination": "/cookie-policy.html" },
{ "source": "/refund-policy", "destination": "/refund-policy.html" }
```

- [ ] **Step 9: Style footer and legal pages**

Use a four-column desktop footer with clear spacing and gold accents; collapse to two columns on tablets and one column on phones. Give legal text a constrained readable width, visible heading hierarchy, accessible link states, and no horizontal overflow.

- [ ] **Step 10: Run focused tests**

Run:

```powershell
node --test tests/production-launch.test.js
```

Expected: all hero, trust, footer, route, and legal-page tests pass.

- [ ] **Step 11: Commit**

```powershell
git add script.js styles.css *.html programs/*/index.html vercel.json tests/production-launch.test.js
git commit -m "feat: add shared footer and legal pages"
```

### Task 4: Define the Fulfillment Email Contract with Tests

**Files:**
- Modify: `tests/checkout-flow.test.js`

- [ ] **Step 1: Replace obsolete Viber assertions**

Remove tests requiring `formatViberBonusForEmail` or `Бонус: Viber група`. Add:

```js
test("fulfillment email contains no separate Viber section", () => {
  const webhook = read("api/stripe/webhook.js");

  assert.doesNotMatch(webhook, /formatViberBonusForEmail|VIBER_GROUP_LINK/);
  assert.doesNotMatch(webhook, /Viber група|Viber бонус/);
});
```

- [ ] **Step 2: Add the customer HTML email contract**

Require the webhook to contain:

```js
assert.match(webhook, /Достъп до твоята Become Pro програма/);
assert.match(webhook, /Отвори програмата/);
assert.match(webhook, /become\.pro2024@gmail\.com/);
assert.match(webhook, /escapeHtml/);
assert.match(webhook, /https:\/\/become-pro-ivory\.vercel\.app\//);
assert.match(webhook, /html:/);
```

Also require program names and `program.programLink` to be used in both the HTML and plain-text builders.

- [ ] **Step 3: Add multipart UTF-8 transport assertions**

Require `sendEmail({ to, subject, text, html })`, a `multipart/alternative` boundary, both `text/plain; charset=UTF-8` and `text/html; charset=UTF-8`, base64 bodies, and Resend JSON containing `text` and `html`.

- [ ] **Step 4: Add a mojibake regression assertion**

Read both email files and reject common broken UTF-8 fragments:

```js
assert.doesNotMatch(`${shared}\n${webhook}`, /Р‘Р|Р”Р|РџР|РЎР|вЂ|в‚/);
```

- [ ] **Step 5: Run the test and confirm failure**

Run:

```powershell
node --test tests/checkout-flow.test.js
```

Expected: failures for the old Viber formatter, missing HTML body, and missing multipart MIME.

- [ ] **Step 6: Commit**

```powershell
git add tests/checkout-flow.test.js
git commit -m "test: define fulfillment email contract"
```

### Task 5: Implement the Professional UTF-8 Email

**Files:**
- Modify: `api/_shared.js`
- Modify: `api/stripe/webhook.js`
- Test: `tests/checkout-flow.test.js`

- [ ] **Step 1: Extend all email sender signatures**

Change:

```js
const sendEmail = async ({ to, subject, text, html }) => {
  if (process.env.RESEND_API_KEY) return sendResendEmail({ to, subject, text, html });
  return sendSmtpEmail({ to, subject, text, html });
};
```

Pass both values through `sendResendEmail`, with `html` omitted only when it is empty.

- [ ] **Step 2: Build a multipart SMTP body**

Create a random MIME boundary and build:

```js
const buildMultipartBody = ({ text, html, boundary }) =>
  [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodeBodyBase64(text),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodeBodyBase64(html),
    `--${boundary}--`,
  ].join("\r\n");
```

Set the top-level header with `` `Content-Type: multipart/alternative; boundary="${boundary}"` ``. Preserve encoded UTF-8 subjects, sanitized addresses, SMTP authentication, and dot-stuffing.

- [ ] **Step 3: Add safe HTML helpers in the webhook**

Add:

```js
const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
```

Use escaped customer names, program names, and links in the HTML output.

- [ ] **Step 4: Build plain-text fulfillment content**

Generate a valid Bulgarian body containing the optional greeting, each purchased program and Drive URL, support email, and `Become Pro` signature. Do not include Viber text.

- [ ] **Step 5: Build the customer HTML template**

Use a table-based, inline-styled email with:

- Absolute logo URL from the production domain.
- Dark background, gold accent, and white content card.
- Heading `Достъп до твоята Become Pro програма`.
- Optional named greeting.
- One program block per purchased product.
- Gold `Отвори програмата` button per product.
- Visible fallback Drive URL.
- Mailto support link.
- `Become Pro` signature.

No scripts, forms, external fonts, or Viber section.

- [ ] **Step 6: Keep the admin email simple and valid**

Correct all Bulgarian admin-email text to UTF-8 and send it as plain text. Include customer, product, amount, paid status, Stripe Session ID, and program links. Do not include Viber content.

- [ ] **Step 7: Preserve failure safeguards**

Keep `ensureFulfillmentPayload` before customer delivery. Any thrown email error must still call `markDeliveryFailed` with `reason: "email_delivery_failed"`, persist the order as `delivery_failed`, and log `fulfillment_delivery_failed`.

- [ ] **Step 8: Run checkout tests**

Run:

```powershell
node --test tests/checkout-flow.test.js
```

Expected: all fulfillment, Stripe identity, Drive-link, delivery-failure, HTML, Viber-removal, and UTF-8 tests pass.

- [ ] **Step 9: Run the full automated suite**

Run:

```powershell
node --test tests/*.test.js
```

Expected: every test passes with zero failures.

- [ ] **Step 10: Commit**

```powershell
git add api/_shared.js api/stripe/webhook.js tests/checkout-flow.test.js
git commit -m "feat: send professional purchase emails"
```

### Task 6: Local Browser QA

**Files:**
- No source changes unless QA discovers a defect.

- [ ] **Step 1: Start the static site locally**

Use the available local static server and open the site in the in-app browser.

- [ ] **Step 2: Verify desktop homepage**

Check the hero at desktop width for:

- Four visible premium stats without crowding the headline.
- Correct video rendering.
- No horizontal overflow.
- Shared footer alignment and all required links.

- [ ] **Step 3: Verify mobile homepage**

At a phone viewport, check:

- Navigation opens, closes, and does not trap the page.
- Stats are a readable two-column grid.
- Buttons remain tappable.
- Hero video and images are not incorrectly cropped.
- Footer stacks without overflow.

- [ ] **Step 4: Verify storefront and all product details**

Open `/programs` and:

- `/programs/technical-pack`
- `/programs/strength-level-1`
- `/programs/strength-level-2`
- `/programs/strength-level-3`
- `/programs/summer-program`
- `/programs/matchday-pack`

Confirm product content is visible, trust cards appear once, prices/buttons render, and nested footer links go to the correct root routes.

- [ ] **Step 5: Verify cart and checkout initiation**

Add a product on desktop and mobile, confirm cart count changes, quantity/remove/total work, and `Продължи към плащане` creates a Stripe Checkout Session. Do not complete a new live charge during this check.

- [ ] **Step 6: Verify legal pages**

Open all four clean routes and check desktop/mobile readability, header/footer consistency, last-updated text, and contact links.

- [ ] **Step 7: Verify the training form**

Submit a controlled training request, confirm the success state, then confirm it appears in the admin training requests panel.

- [ ] **Step 8: Fix and retest any local UI defects**

For each defect, add or update the narrowest automated regression test before changing source code, then rerun the relevant test file and browser flow.

### Task 7: Deploy and Production Verification

**Files:**
- No planned source changes unless production verification finds a defect.

- [ ] **Step 1: Push the approved commits**

Push the implementation branch or committed `main` changes to GitHub and wait for the Vercel production deployment.

- [ ] **Step 2: Verify deployment health**

Confirm the Vercel deployment state is `Ready`, the production domain resolves, and runtime logs show no startup or route errors.

- [ ] **Step 3: Run production public-page QA**

Repeat desktop/mobile checks for homepage, programs, all product detail pages, cart, footer links, and legal routes on `https://become-pro-ivory.vercel.app`.

- [ ] **Step 4: Verify production Stripe checkout without charging**

Create a live Checkout Session from the production cart and confirm:

- Checkout opens on Stripe.
- Product name and €0.50 test price are correct.
- Session appears in the verified Stripe live account.
- Cancel returns to the production site.

- [ ] **Step 5: Verify admin and Supabase workflows**

Open the production admin panel and confirm:

- Paid, pending, failed, expired, and `delivery_failed` filters load.
- Stripe diagnostics report the expected live account and webhook.
- Orders and admin logs load.
- The controlled training request appears and status updates work.

- [ ] **Step 6: Replay an already-paid Stripe Checkout Session**

Use a previously paid, known session with a recognized program ID and customer email. Replay `checkout.session.completed` through the configured production webhook so no new charge is created.

- [ ] **Step 7: Inspect the delivered email**

Confirm:

- The message arrives.
- Subject and all Bulgarian text render correctly.
- Logo loads.
- Correct program name is shown.
- `Отвори програмата` opens the correct Drive file.
- Fallback Drive URL matches the button.
- No Viber section or mojibake exists.
- Support mail link works.

- [ ] **Step 8: Confirm order state and logs**

Verify the replayed order remains `paid` after successful delivery. Confirm there is no new `fulfillment_delivery_failed`, `fulfillment_access_link_missing`, or `stripe_program_missing` log for the session.

- [ ] **Step 9: Run final automated regression**

Run:

```powershell
node --test tests/*.test.js
```

Expected: zero failing tests after production verification.

- [ ] **Step 10: Produce the final launch report**

Report:

- Changes completed.
- Pages tested on desktop and mobile.
- Cart and live Checkout Session status.
- Stripe/webhook/account status.
- Admin order and training request status.
- Delivered email result and correct Drive destination.
- Any residual legal or operational caveat.
- Explicit `Ready for launch` or `Not ready for launch` verdict.
