# Individual Training Landing Page and Analytics Design

Date: 2026-06-14
Status: Approved design

## Goal

Create a separate campaign landing page at `/individual-training` whose only conversion goal is submitting a request for an individual football training session. The existing `/training` page and the rest of the main website remain unchanged.

The implementation must also provide lightweight first-party funnel analytics, campaign attribution on submitted requests, and an admin dashboard that supports decisions based on landing page and UTM performance.

## Scope

The first release creates only the base `/individual-training` landing page. The architecture must support future variants such as:

- `/individual-training/plovdiv`
- `/individual-training/sofia`
- `/individual-training/stara-zagora`
- `/individual-training/parents`
- `/individual-training/players`

Future variants will reuse the same page renderer, form workflow, analytics API, data model, and admin reports while setting their own `page_variant`, copy, media, and optional city.

## Landing Page Experience

The page is mobile-first, focused, and visually consistent with Become Pro's dark and gold premium style. It does not use the full main-site navigation because campaign visitors should have one clear path to conversion.

### Header

- Become Pro logo
- One prominent "Запази тренировка" button
- No full navigation menu

### Hero

Heading:

> Индивидуални футболни тренировки за играчи, които искат реален прогрес

Supporting text:

> Персонална работа върху техника, първо докосване, дрибъл, скорост, завършване и увереност с топката.

Actions:

- "Запази тренировка" scrolls to the form and records `click_primary_cta`
- "Виж как работи" scrolls to the process section and records `click_secondary_cta`

The hero uses an existing real Become Pro training video or image, optimized for fast mobile loading.

### Audience Section

Cards for:

- Начинаещи играчи
- Играчи в клуб
- Нападатели и крила
- Халфове
- Родители, които търсят допълнителна индивидуална работа за детето си

### Player Benefits

- Оценка на текущото ниво
- Индивидуален фокус според позицията
- Работа върху конкретни слабости
- Ясна обратна връзка
- Упражнения, приложими в реална игра
- Насоки за развитие след тренировката

### Process

Three steps:

1. Попълваш кратката форма
2. Свързваме се с теб до 24 часа
3. Уточняваме удобен ден, час и локация

### Trust and Results

Use existing approved player photos and data from the project. Each visible player card contains:

- Photo
- Name
- Age when known
- City or club when known
- Short factual description or result

No placeholder facts or invented claims are allowed.

### Training Video

A dedicated section with a real training video and the text:

> Виж как изглежда една индивидуална тренировка.

The video uses `playsinline`, muted preview behavior, and an image/poster fallback suitable for mobile.

### FAQ

- За каква възраст са тренировките?
- Къде се провеждат?
- Колко продължава една тренировка?
- Може ли родителят да присъства?
- Подходящи ли са, ако играчът вече тренира в клуб?

Answers reuse verified information already present on the main training page.

### Conversion Form

Fields:

- Кого искате да запишете? (`Моето дете` or `Себе си`)
- Име
- Град
- Телефонен номер

Submit label:

> Запази тренировка

Success message:

> Благодаря ви! Заявката е изпратена успешно. Ще се свържем с вас възможно най-скоро.

The first interaction with any form field records `form_start` once per session. A successful server response records `form_submit_success`; a failed response records `form_submit_error`.

### Mobile Conversion

- Large, touch-friendly CTA buttons
- Compact sections and short form
- Sticky bottom "Запази тренировка" CTA on mobile
- No horizontal overflow
- Media must not be incorrectly cropped
- Sticky CTA must not cover form controls or footer content

### Footer

A compact footer contains:

- Email
- Phone
- Privacy policy
- Terms
- Cookie policy

## Campaign Attribution

The page reads and normalizes:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

The base page sets `page_variant` to `general`. Future routes will set explicit variants such as `plovdiv`, `sofia`, `parents`, or `players`.

The form submission stores:

- `landing_page_url`
- `page_variant`
- all supported UTM fields
- `referrer`
- `device_type`
- `browser`
- server-generated request timestamp

These attribution fields are stored with the personal training request only after the visitor submits the form.

## First-Party Analytics

Analytics starts immediately when the page loads and does not use advertising cookies.

A random anonymous `session_id` is stored in `sessionStorage`. It expires when the browser session ends and is not shared with other sites. Analytics events never include the visitor's name, phone number, email address, or IP address.

Supported events:

- `page_view`
- `scroll_50`
- `scroll_90`
- `click_primary_cta`
- `click_secondary_cta`
- `form_start`
- `form_submit_success`
- `form_submit_error`

Every event contains:

- `session_id`
- `landing_page_url`
- `page_variant`
- `event_name`
- `event_time`
- UTM fields
- `referrer`
- `device_type`

`page_view`, `scroll_50`, `scroll_90`, and `form_start` are emitted at most once for the current page and session. CTA clicks and form submit results may be emitted for each actual interaction.

The analytics client is lightweight plain JavaScript. It uses `navigator.sendBeacon` when appropriate and `fetch` with `keepalive` as a fallback. Analytics failures are silent for the visitor and never block page interaction or form submission.

## API Design

### `POST /api/landing-analytics`

- Accepts only the approved event names
- Validates the UUID-like session identifier
- Trims and limits every string field
- Does not read or store request IP headers
- Adds the authoritative server timestamp
- Writes one row to `landing_analytics_events`
- Returns `202` or `201` on accepted events
- Returns validation errors without exposing infrastructure details

### `POST /api/training-requests`

The existing endpoint remains compatible with the existing contact form. It accepts optional attribution metadata from the landing page and persists it with the request.

Analytics persistence failure does not prevent a valid personal training request from being saved.

### `GET /api/admin/landing-analytics`

Requires the existing admin session. Supported filters:

- Start date
- End date
- Landing page or page variant
- `utm_source`
- `utm_medium`
- `utm_campaign`

The API returns:

- Total page views
- Unique sessions
- Primary and secondary CTA clicks
- Total CTA clicks
- Form starts
- Successful form submissions
- Form errors
- Conversion rate
- Breakdown by page variant
- Breakdown by UTM campaign
- Breakdown by city variant when such variants exist

Conversion rate is:

`unique sessions with form_submit_success / unique sessions with page_view * 100`

All aggregation happens server-side. The browser receives summary rows, not the entire raw event history.

## Database Design

### Training Request Attribution

Add nullable columns to `training_requests`:

- `landing_page_url text`
- `page_variant text`
- `utm_source text`
- `utm_medium text`
- `utm_campaign text`
- `utm_content text`
- `utm_term text`
- `referrer text`
- `device_type text`
- `browser text`

Keep the existing `created_at` value as the authoritative request timestamp.

Add indexes for:

- `created_at desc`
- `page_variant`
- `utm_campaign`

### Analytics Events

Create `landing_analytics_events` with:

- `id uuid primary key`
- `session_id text not null`
- `landing_page_url text not null`
- `page_variant text not null`
- `event_name text not null` with an allowed-value check
- UTM fields
- `referrer text`
- `device_type text`
- `event_time timestamptz not null default now()`

No IP or personal-data columns are permitted.

Indexes:

- `event_time desc`
- `(page_variant, event_time desc)`
- `(utm_campaign, event_time desc)`
- `(session_id, event_time desc)`
- `(event_name, event_time desc)`

Row Level Security remains enabled and public direct access is not granted. Public events pass through the server API using the service role.

## Retention

Analytics events are retained for 12 months.

The schema provides a `delete_expired_landing_analytics()` SQL function that deletes events older than 12 months. When Supabase `pg_cron` is available, the schema schedules this function daily. A documented manual SQL call remains available if scheduled jobs are unavailable.

Training requests are not deleted by this analytics retention task.

## Admin Panel

### Training Requests

The existing "Заявки за индивидуални тренировки" table adds:

- Landing page / variant
- Campaign
- City
- Phone
- Status
- Date

Statuses remain:

- Нова (`new`)
- Свързан (`contacted`)
- Записан (`booked`)
- Отказан (`declined`)

### Landing Page Analytics

A separate "Landing Page Analytics" section contains:

- Period filter
- Landing page/variant filter
- UTM source filter
- UTM medium filter
- UTM campaign filter
- Apply and reset controls
- Summary cards for visits, unique sessions, CTA clicks, form starts, submissions, and conversion rate
- Breakdown table by page variant
- Breakdown table by campaign
- City performance derived from city page variants when available

The current base page appears as variant `general`.

## Privacy and Legal

The privacy and cookie policies will disclose that Become Pro uses lightweight first-party, cookieless analytics for page and funnel measurement. The analytics identifier is limited to the current browser session, is not used for advertising profiles, and does not contain personal data.

If future tracking introduces advertising cookies, cross-site identifiers, fingerprinting, or third-party marketing pixels, that tracking must be handled separately and must not inherit the consent assumptions of this design.

## Error Handling

- Invalid analytics events return `400` and are not stored.
- Database analytics errors are logged server-side but do not affect the landing page form.
- Form validation errors are displayed next to the form without clearing valid entered values.
- Duplicate clicks do not create duplicate form requests because the submit button is disabled while the request is in progress.
- Admin analytics shows a clear empty state when no events match the selected filters.
- Legacy production training-request schemas remain supported until the migration is applied, but new attribution columns require the updated schema for full reporting.

## Testing and QA

Automated tests cover:

- Landing page route and required sections
- Exact form fields and success text
- Mobile sticky CTA
- UTM extraction and `page_variant`
- Every approved analytics event
- Analytics payload excludes personal data
- Event API validation and persistence
- Training request attribution persistence
- Admin API authentication and filters
- Funnel metric calculations
- Admin analytics controls and result rendering
- Schema columns, constraints, indexes, and retention function

Browser QA covers:

- Desktop layout
- Mobile layout
- Primary and secondary CTA scrolling
- Sticky mobile CTA
- Form success and error states
- Supabase training request row
- Analytics event rows
- UTM attribution
- Admin request columns
- Admin funnel filters and conversion metrics
- No console errors, broken media, or horizontal overflow

## Future Variant Workflow

New variants will:

1. Add a clean route under `/individual-training/<variant>`.
2. Declare a variant configuration containing `page_variant`, optional city, copy, and media overrides.
3. Reuse the same landing page layout and JavaScript.
4. Send the same analytics event schema.
5. Appear automatically in admin variant and campaign breakdowns.

No new database table or analytics endpoint is required for each variant.
