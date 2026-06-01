# Live Training Player Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three live training cards with equal-height testimonial cards using the supplied photos and approved content.

**Architecture:** Keep the existing static HTML and CSS structure. Add narrowly scoped `live-player-card` styles so the online-player cards remain unchanged.

**Tech Stack:** Static HTML, CSS, local raster assets, browser responsive verification.

---

### Task 1: Add Assets

**Files:**
- Create: `assets/slavcho-ahmedov.jfif`
- Create: `assets/albena-georgieva.jfif`
- Create: `assets/ivan-trifonov.jfif`

- [ ] Copy the three supplied images into `assets/` with descriptive names.

### Task 2: Replace Live Card Markup

**Files:**
- Modify: `players.html`

- [ ] Run a static check and confirm the new live-card structure is missing.
- [ ] Replace the three old cards with the approved image, badge, name, facts, and quote structure.
- [ ] Run the static check and confirm all three cards use the new structure.

### Task 3: Add Scoped Styling

**Files:**
- Modify: `styles.css`

- [ ] Add equal-height content, badge, fact, quote, and hover image zoom styles scoped to `.live-player-card`.
- [ ] Run `git diff --check`.
- [ ] Verify desktop and mobile rendering without overlap or horizontal overflow.

