# Become Pro Launch Polish and Email Design

## Goal

Prepare Become Pro for official launch by improving purchase trust, homepage credibility, site-wide footer consistency, legal coverage, and post-purchase email delivery.

## Scope

The work covers:

- Premium statistics in the homepage hero.
- A purchase trust section below the online program cards and on product detail pages.
- One consistent responsive footer across all public pages.
- Four Bulgarian legal pages.
- A professional HTML fulfillment email with a plain-text fallback.
- Removal of the separate Viber section from emails.
- Production deployment and end-to-end desktop, mobile, checkout, form, admin, and email QA.

The Viber group is not linked separately. Any Viber information is contained inside the purchased PDF.

## Homepage Hero

Replace the current hero statistics with four compact premium cards:

- `50+` — футболисти
- `100+` — проведени тренировки
- `4+` — футболни програми
- `10–24` — години подходяща възраст

The cards use the existing dark visual language with restrained gold accents. They remain secondary to the headline and primary calls to action. On mobile they become a readable two-column grid without horizontal scrolling.

## Purchase Trust Section

Add a reusable trust section immediately below:

- The program storefront grid on `/programs`.
- The primary purchase content on every product detail page.

The section contains four concise items:

- Сигурно плащане чрез Stripe
- Моментален достъп след успешна покупка
- Получаваш програмата директно на имейл
- Поддръжка при проблем с достъпа

The visual treatment uses four compact cards with simple typographic or CSS icons. No new image assets or icon library are required.

## Shared Footer

Render one shared footer template from `script.js` on every public page. Existing page-specific footer markup serves only as a mounting point and is replaced at runtime.

The footer contains:

- Become Pro logo and short brand statement.
- Navigation to programs, individual training, players, FAQ, and contacts.
- Instagram.
- TikTok.
- Email: `become.pro2024@gmail.com`.
- Phone: `+359 897 575 257`.
- Privacy policy.
- Terms and conditions.
- Cookie policy.
- Refund policy.
- Copyright notice.

Links use root-relative URLs so the same template works on top-level and nested product pages. The footer becomes a multi-column desktop layout and a clear stacked mobile layout.

Admin pages are excluded from the public shared footer.

## Legal Pages

Create:

- `/privacy-policy`
- `/terms`
- `/cookie-policy`
- `/refund-policy`

Each route has:

- A dedicated Bulgarian page title and metadata.
- The existing site header and shared footer.
- A readable legal content container.
- Last-updated date.
- Contact details.
- Clear headings and concise paragraphs.

### Privacy Policy

Cover:

- Data collected through purchases and training requests.
- Purpose and legal basis of processing.
- Stripe, email, hosting, and database processors.
- Retention and protection.
- User rights and contact procedure.

### Terms

Cover:

- Website and merchant identity/contact.
- Digital program ordering and payment.
- Delivery by email and access link.
- Personal, non-transferable use.
- Prohibited redistribution.
- Customer responsibilities.
- Service availability and support.
- Applicable Bulgarian law.

### Cookie Policy

Explain:

- Essential cookies and local storage.
- Admin authentication cookies.
- Cart storage.
- Possible third-party services.
- Browser-level cookie controls.

Do not claim that optional analytics or marketing cookies are used unless they exist in the production site.

### Refund Policy

Explain:

- The products are digital content delivered immediately after successful payment.
- The customer expressly requests immediate delivery through the purchase flow.
- Refund requests are reviewed when access was not delivered, the supplied link is invalid, or duplicate payment occurred.
- Requests are submitted to `become.pro2024@gmail.com` with payment details.
- Approved refunds are returned through the original payment method.

The wording is a professional baseline and does not present itself as individual legal advice.

## Fulfillment Email

### Content

The customer email includes:

- Become Pro logo using an absolute production URL.
- Heading: `Достъп до твоята Become Pro програма`.
- Personalized greeting when a customer name is available.
- Purchased program name.
- A prominent `Отвори програмата` button.
- The direct Google Drive URL as a fallback.
- Support contact: `become.pro2024@gmail.com`.
- Final Become Pro signature.

For purchases containing multiple programs, render one clearly labeled button and fallback link per program.

The email must not contain a separate Viber section.

### Format and Delivery

Extend `sendEmail` to accept both `text` and `html`.

SMTP messages use a `multipart/alternative` MIME body:

- Plain-text fallback encoded as UTF-8 base64.
- HTML body encoded as UTF-8 base64.
- UTF-8 encoded subject.

Resend requests include both `text` and `html`.

The HTML uses email-safe inline styles, table-based layout where appropriate, an accessible button link, escaped customer/program values, and no client-side scripts.

### Failure Handling

The existing fulfillment safeguards remain:

- Paid orders are persisted.
- Email failures mark the order as `delivery_failed`.
- Failures are written to admin logs.
- A missing or invalid Drive link prevents an empty fulfillment email.

## Implementation Boundaries

- Use existing static HTML, CSS, and vanilla JavaScript patterns.
- Do not introduce a frontend framework or icon dependency.
- Do not redesign unrelated sections.
- Preserve current Stripe Checkout, Supabase, admin, and training request behavior.
- Preserve root-relative URLs for production compatibility.

## Testing

Automated tests verify:

- All four homepage statistics.
- Trust section text and placement.
- Shared footer content and legal links.
- All legal routes and page content.
- Every public page mounts the shared footer.
- Product detail pages receive the trust section.
- HTML email contains logo, heading, program name, Drive button, fallback link, and contact.
- Viber text is absent.
- SMTP uses multipart UTF-8 base64.
- Existing checkout, admin, and training tests remain green.

Production QA verifies:

- Homepage desktop and mobile layouts.
- Program storefront and product detail pages.
- Footer links from top-level and nested pages.
- Four legal routes.
- Cart and Stripe Checkout Session creation without completing a charge.
- Admin orders, logs, and training requests.
- Training request submission.
- Email fulfillment through replay of an already-paid Stripe Checkout Session, avoiding a new charge.
- Delivered email displays valid Bulgarian, the correct program, and the correct Drive destination.

## Launch Criteria

Production is ready for launch when:

- All automated tests pass.
- Vercel deployment is Ready.
- Checkout creates a valid live Stripe session.
- Webhook fulfillment records a paid order.
- The fulfillment email arrives with valid Bulgarian and correct links.
- Footer and legal pages work on desktop and mobile.
- No blocking console errors, broken routes, or missing assets remain.
