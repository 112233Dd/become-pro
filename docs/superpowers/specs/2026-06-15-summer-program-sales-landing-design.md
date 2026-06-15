# Summer Program Sales Landing Page Design

## Goal

Create a dedicated, mobile-first sales landing page at `/summer-program` with one objective: sell the Become Pro Summer Program through direct Stripe Checkout.

The page targets both football players and parents arriving from TikTok, Instagram, and Facebook campaigns. It must contain no navigation menu, cart link, other programs, side offers, or unrelated calls to action.

## Commercial Configuration

- Product ID: `summer-program`
- Test price: `0.50 EUR`
- Payment type: one-time payment
- Checkout: Stripe Checkout created only for `summer-program`
- Access delivery: automatic email after successful payment
- Purchase confirmation: recorded by the Stripe webhook, not inferred from the success page

## Page Structure

### 1. Minimal Header

- Become Pro logo linked to the top of the page
- One gold CTA: `Вземи програмата`
- No navigation menu
- No cart counter

### 2. Hero

- Direct benefit-led headline for players and parents
- Short supporting copy focused on summer development
- Program cover or strong existing training visual
- Visible test price: `0,50 €`
- Primary CTA: `Вземи Лятната програма`
- Short trust line for one-time payment and immediate access

### 3. Problem

Explain the common summer problem:

- loss of rhythm during the break
- training without structure
- inconsistent technical and physical work
- uncertainty about what to train and when

### 4. Solution

Present the Summer Program as a clear, structured plan for continuing development during the summer without random workouts.

### 5. What You Get

Use four clear premium cards:

- Технически тренировки
- Скорост и експлозивност
- Физическа подготовка
- Ясен план за действие

### 6. Program Contents

Explain the practical format, training focus, expected access method, and how the player follows the plan. Copy must remain accurate to the existing Summer Program product data and must not promise unverified results.

### 7. Who It Is For

Address both audiences:

- players who want structured independent summer work
- parents seeking a clear additional development plan
- players already training in a club
- ambitious players who want to maintain or improve their level

### 8. Social Proof

Display two compact proof metrics:

- `50+ футболисти`
- `100+ проведени тренировки`

The section must use the same dark, gold, premium visual language as the existing Become Pro player and program cards.

### 9. Price

- Price: `0,50 €`
- Clearly state that payment is one-time
- No subscriptions
- Primary CTA launches Stripe Checkout directly for `summer-program`
- No add-to-cart step

### 10. Guarantee and Security

Title: `Гаранция и сигурност`

- Сигурно плащане чрез Stripe
- Моментален достъп след покупка
- Без абонаменти и скрити такси
- Поддръжка при въпроси

This is a trust section, not a money-back guarantee.

### 11. FAQ

Questions should address:

- how access is delivered
- whether the payment is one-time
- which age or player level the program suits
- whether it can complement club training
- what to do if the access email does not arrive

### 12. Final CTA

A dedicated conversion block immediately before the footer:

- concise outcome-focused headline
- price reminder
- primary CTA to direct Stripe Checkout
- Stripe and immediate-access reassurance

### 13. Minimal Footer

Include only:

- Become Pro identity
- support email
- Privacy Policy
- Terms
- Cookie Policy
- Refund Policy

## Visual Direction

- Existing Become Pro black and gold palette
- Premium card treatment matching programs, players, and FAQ
- Strong type hierarchy with short paragraphs
- Compact sections and large tap targets
- No white SaaS-style panels
- Existing optimized assets wherever possible
- No horizontal overflow
- Mobile sticky CTA displaying the action and price

## Checkout Flow

1. Visitor clicks a purchase CTA.
2. The page records `click_primary_cta`.
3. The page records `checkout_started`.
4. The existing `/api/create-checkout-session` endpoint receives only `summer-program`.
5. After a Stripe Checkout Session is returned, record `checkout_created`.
6. Redirect the visitor to Stripe.
7. On a creation failure, record `checkout_error` and show a clear retry message.
8. After successful payment, the Stripe webhook records the paid order and emits the purchase analytics event.
9. Existing fulfillment sends the Summer Program access email.

## Analytics

### Anonymous Browser Events

- `page_view`
- `scroll_25`
- `scroll_50`
- `scroll_75`
- `scroll_90`
- `view_problem`
- `view_solution`
- `view_program_contents`
- `view_price`
- `click_primary_cta`
- `checkout_started`
- `checkout_created`
- `checkout_error`

Each event stores:

- anonymous `session_id`
- landing page URL
- page variant: `summer-program`
- event time
- UTM source, medium, campaign, content, and term
- referrer
- device type

Analytics must not store name, phone, email, or IP address.

### Purchase Event

`purchase_completed` is written server-side only after a verified `checkout.session.completed` Stripe webhook event.

The purchase event includes:

- anonymous landing session ID when available
- Stripe Checkout Session ID
- page variant `summer-program`
- program ID
- UTM attribution copied into Stripe metadata
- event time

The implementation must be idempotent so webhook retries do not create duplicate purchase events.

## Database and Admin Analytics

Extend the existing first-party landing analytics model to accept the new Summer Program funnel events. The existing 12-month retention applies.

The admin analytics dashboard must be able to filter the events by:

- landing page
- variant
- UTM source
- UTM medium
- UTM campaign
- period

The existing funnel summary should include Summer Program visits, CTA clicks, checkout starts, checkout creation, and completed purchases without exposing customer personal data.

## Routing

- Add `/summer-program` as a clean route for the new dedicated landing page.
- Keep `/programs/summer-program` as the existing general product-detail page.
- Do not replace or redirect the existing product page.

## Failure Handling

- Analytics failures must never block checkout.
- Checkout errors display an inline Bulgarian error and restore CTA availability.
- Duplicate CTA clicks are guarded while a Checkout Session is being created.
- A successful payment remains a paid order even if email delivery fails, using the existing `delivery_failed` safeguard.
- Missing access links continue to be logged rather than sending an empty fulfillment email.

## Testing and QA

Automated checks:

- exact route and page structure
- no standard site navigation, cart, or unrelated product links
- all CTAs target only `summer-program`
- test price is visible and matches Stripe catalog configuration
- all approved analytics events are accepted
- personal data is rejected by analytics
- purchase event is webhook-only and idempotent
- Vercel Function count remains within the Hobby limit

Rendered QA:

- desktop Chrome
- iPhone-sized viewport
- Android-sized viewport
- no horizontal scroll
- sticky CTA behavior
- section visibility tracking
- CTA click and checkout redirect
- production Stripe test-price checkout
- webhook order record and purchase event
- correct fulfillment email
- admin analytics visibility

## Deployment Acceptance

The work is complete when:

- the production deployment is `Ready`
- `https://become-pro-ivory.vercel.app/summer-program` loads the dedicated page
- direct Stripe Checkout is created for only the Summer Program
- browser funnel events are stored with UTM attribution
- `purchase_completed` is stored only after the verified Stripe webhook
- the paid order and fulfillment behavior remain intact
- production desktop and mobile screenshots pass visual review
