# Summer Program Social Proof Design

## Goal

Strengthen `/summer-program` with concrete product previews, coach authority, real player proof, approved testimonials, and clearer promotional pricing while keeping the focused black-and-gold sales flow.

## Page Order

The page order becomes:

1. Hero
2. Player statistics and online-player proof
3. Problem
4. Solution
5. What you receive
6. PDF preview
7. Who it is for
8. Coach authority
9. Testimonials
10. Price
11. Guarantee
12. FAQ
13. Final CTA

## PDF Preview

Add a `Виж какво получаваш` section using rendered preview images from the existing Summer Program Google Drive PDF. Use pages 3, 5, 6, and 7:

- how to follow the training program;
- weekly schedule examples;
- age-specific fitness program navigation;
- speed, technique, and running program navigation.

The previews are static optimized images stored under `assets/summer-program-preview/`. They are visual samples only and do not expose the full linked training material.

## Player Proof

Move the existing `50+ футболисти` and `100+ проведени тренировки` statistics directly after the Hero. Extend this section with the three real online-player profiles already published on the main Players page:

- Мирослав Маринов - Фратрия, 21, нападател/крило;
- Ирен Георгиева - Brooke House, 15, дефанзивен халф;
- Панайот Пасков - Локомотив Горна Оряховица, 19, халф.

Use their existing project images and concise verified achievements.

## Coach Authority

Add a `За треньора` section using `assets/coach-yordan-zhelev.png` and existing verified copy:

- Йордан Желев;
- coach for individual football development;
- First League debut at age 16;
- Bulgaria U15 experience;
- Nottingham Forest experience.

The section supports trust but does not add navigation or a competing offer.

## Testimonials

Use the three existing online-program testimonials:

- Играч, 16 г.;
- Родител на играч, 13 г.;
- Играч, 18 г.

No new names, claims, or quotes are invented.

## Pricing

Every visible sales-price treatment on this landing page uses the phrase `Промо цена 0,50 €`. Stripe checkout remains unchanged at EUR 0.50.

## Tracking

Existing commerce tracking remains unchanged. Add section-view events for:

- `view_product_preview`;
- `view_coach`;
- `view_testimonials`.

The public analytics allowlist and Supabase event constraint are extended without adding a new Vercel Function.

## Quality

- Mobile-first stacking;
- lazy-loaded preview/player/coach images;
- no horizontal scrolling;
- no broken assets;
- direct Stripe checkout remains the only commercial action;
- existing `/programs/summer-program` product page remains unchanged.
