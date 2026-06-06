# Live Test Price And Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set every online program to a real EUR 0.50 Stripe price, update the training hero CTA, and rename the public Results navigation label to Players.

**Architecture:** Keep the existing static storefront and Vercel serverless checkout structure. Update both the browser catalog in `shop.js` and the authoritative Stripe catalog in `api/_shared.js`, then align all visible navigation labels without changing the stable `players.html` URL.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js Vercel Functions, Stripe Checkout, Node test runner.

---

### Task 1: Add regression coverage

**Files:**
- Modify: `tests/checkout-flow.test.js`

- [ ] Add assertions for EUR 0.50 storefront and Stripe prices.
- [ ] Add assertions for the training CTA and Players navigation label.
- [ ] Run `node --test tests/*.test.js` and confirm the new assertions fail.

### Task 2: Update storefront and Stripe catalog

**Files:**
- Modify: `shop.js`
- Modify: `api/_shared.js`
- Modify: `faq.html`

- [ ] Set all six storefront prices to `€0.50`.
- [ ] Set all six server prices to `0.5` and `50` cents.
- [ ] Update the public pricing answer to `€0.50`.

### Task 3: Update CTA and navigation language

**Files:**
- Modify: `training.html`
- Modify: all public HTML navigation files
- Modify: `players.html`

- [ ] Change the secondary hero CTA to “Попълни анкетата” and link it to `contact.html`.
- [ ] Change every public “Резултати” navigation label to “Играчи”.
- [ ] Update the Players page title and eyebrow while retaining `players.html`.

### Task 4: Verify and publish

- [ ] Run `node --test tests/*.test.js`.
- [ ] Search for stale `€49.99`, `4999`, “Виж за кого е”, and public “Резултати” labels.
- [ ] Inspect the git diff.
- [ ] Commit the intended files to `main`.
- [ ] Push `main` to GitHub and verify the production deployment.
