# Online Player Cards Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three online player cards with a consistent two-box layout containing verified profile information and achievements.

**Architecture:** Keep the existing static HTML page and card grid. Update only the three online card bodies in `players.html`, then extend the existing player-card CSS with small online-card-specific rules so card heights, internal spacing, and mobile containment remain consistent.

**Tech Stack:** Static HTML, CSS, local HTTP server, browser responsive verification.

---

### Task 1: Replace Online Player Card Content

**Files:**
- Modify: `players.html:47-110`

- [ ] **Step 1: Add a content assertion that fails before the edit**

Run:

```powershell
$html = Get-Content players.html -Raw
@(
  $html.Contains('<strong>Играе за:</strong>')
  $html.Contains('<strong>Години:</strong>')
  $html.Contains('<strong>Позиция:</strong>')
  $html.Contains('<strong>Отличия:</strong>')
  -not $html.Contains('Използва Become Pro за:')
  -not $html.Contains('Профилът ще бъде допълнен')
) -notcontains $false
```

Expected: `False`

- [ ] **Step 2: Replace each online card body**

Use this structure under each online player name:

```html
<div class="player-detail-block player-profile-facts">
  <div class="player-fact-row">
    <strong>Играе за:</strong>
    <p>...</p>
  </div>
  <div class="player-fact-row">
    <strong>Години:</strong>
    <p>...</p>
  </div>
  <div class="player-fact-row">
    <strong>Позиция:</strong>
    <p>...</p>
  </div>
</div>
<div class="player-detail-block player-achievements">
  <strong>Отличия:</strong>
  <ul>
    <li>...</li>
  </ul>
</div>
```

- [ ] **Step 3: Re-run the content assertion**

Run the assertion from Step 1.

Expected: `True`

### Task 2: Add Equal-Height Responsive Styling

**Files:**
- Modify: `styles.css:4362-4455`

- [ ] **Step 1: Add online-card layout rules**

Add:

```css
.online-player-card {
  display: flex;
  flex-direction: column;
}

.online-player-card .player-profile-copy {
  flex: 1;
  grid-template-rows: auto auto 1fr;
}

.player-profile-facts {
  gap: 0;
}

.player-fact-row {
  display: grid;
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(245, 196, 0, 0.12);
}

.player-fact-row:first-child {
  padding-top: 0;
}

.player-fact-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.player-achievements {
  align-content: start;
}

.player-achievements ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
}

.player-achievements li {
  color: #d8d2c3;
  line-height: 1.5;
}
```

- [ ] **Step 2: Run static validation**

Run:

```powershell
git diff --check
```

Expected: no errors.

### Task 3: Verify Responsive Layout

**Files:**
- Verify: `players.html`

- [ ] **Step 1: Open the page locally**

Run a local HTTP server if needed and open:

```text
http://127.0.0.1:8000/players.html?qa=online-card-layout
```

- [ ] **Step 2: Check desktop**

Verify at approximately `1440x900`:

- three cards appear on one row;
- cards have matching heights;
- no middle box exists;
- no text overlaps or overflows.

- [ ] **Step 3: Check mobile**

Verify at approximately `390x844`:

- cards stack vertically;
- long club and position values wrap inside their boxes;
- no horizontal scrolling or overflow.

- [ ] **Step 4: Review git diff**

Run:

```powershell
git diff -- players.html styles.css
```

Expected: changes are limited to the online player cards and their CSS rules.
