# Summer Program Social Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real PDF previews, online-player proof, coach authority, approved testimonials, and promotional price language to the dedicated Summer Program landing page.

**Architecture:** Extend the existing static `summer-program.html` and isolated CSS without introducing new API routes. Render selected pages from the existing Drive PDF into optimized local images, reuse verified assets and copy from `players.html`, `coach.html`, and `shop.js`, and extend the existing anonymous analytics allowlist for three new section-view events.

**Tech Stack:** Static HTML5, CSS, vanilla JavaScript, Python PDFium/Pillow for asset rendering, Supabase event constraints, Node built-in tests, in-app browser QA, Vercel Git deployment.

---

### Task 1: Lock the content and layout contract

**Files:**
- Modify: `tests/summer-program-landing.test.js`

- [ ] Add failing assertions for the new page order, four PDF preview assets, three online-player profiles, coach proof, three approved testimonials, and `Промо цена 0,50 €`.
- [ ] Run `node --test tests\summer-program-landing.test.js` and confirm the new assertions fail because the sections are absent.

### Task 2: Create optimized PDF preview assets

**Files:**
- Create: `assets/summer-program-preview/program-structure.webp`
- Create: `assets/summer-program-preview/weekly-plan.webp`
- Create: `assets/summer-program-preview/fitness-levels.webp`
- Create: `assets/summer-program-preview/training-library.webp`

- [ ] Render PDF pages 3, 5, 6, and 7 from `.codex-tools/summer-program-source.pdf`.
- [ ] Resize each image to a web-friendly width while preserving legibility.
- [ ] Export WebP images with balanced quality and verify each rendered file visually.

### Task 3: Build the proof, preview, coach, and testimonial sections

**Files:**
- Modify: `summer-program.html`
- Modify: `summer-program.css`

- [ ] Move `#summer-proof` directly below `#summer-hero`.
- [ ] Add online-player cards for Мирослав Маринов, Ирен Георгиева, and Панайот Пасков using existing assets and verified profile data.
- [ ] Add `#summer-preview` with the four PDF preview images and short labels.
- [ ] Add `#summer-coach` using the existing Йордан Желев image and verified authority facts.
- [ ] Add `#summer-testimonials` with the three approved online-program testimonials.
- [ ] Replace every landing-page price presentation with `Промо цена 0,50 €`.
- [ ] Add responsive grid, card, image, and typography styles using the existing black-and-gold design tokens.
- [ ] Run the dedicated landing test and confirm it passes.

### Task 4: Extend anonymous section tracking

**Files:**
- Modify: `summer-program.js`
- Modify: `api/landing-analytics.js`
- Modify: `supabase/schema.sql`
- Modify: `tests/summer-program-landing.test.js`

- [ ] Add failing assertions for `view_product_preview`, `view_coach`, and `view_testimonials`.
- [ ] Add the three events to the browser allowlist and attach `data-track-view` to their sections.
- [ ] Add the events to the public analytics API allowlist and Supabase check constraint.
- [ ] Run the dedicated and full test suites.
- [ ] Apply the event-constraint migration in Supabase SQL Editor.

### Task 5: Browser QA and production deployment

**Files:**
- Verify: `summer-program.html`
- Verify: `summer-program.css`
- Verify: `summer-program.js`

- [ ] Verify desktop at 1440x900 and mobile at 390x844 and 412x915.
- [ ] Confirm no horizontal scroll, all images load, statistics follow the Hero, and the CTA remains sticky on mobile.
- [ ] Confirm checkout still opens live Stripe Checkout for the Summer Program at EUR 0.50.
- [ ] Run all tests and `git diff --check`.
- [ ] Commit, push `main`, wait for Vercel `Ready`, and verify the production URL.
