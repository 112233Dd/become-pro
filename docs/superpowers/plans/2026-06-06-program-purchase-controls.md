# Program Purchase Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the €0.50 price and direct cart/Stripe purchase controls consistently for all six online programs.

**Architecture:** Keep `shopPrograms` in `shop.js` as the single frontend catalog. Render storefront and related-product cards from that catalog, reuse the existing delegated cart and Stripe handlers, and keep product detail hero/final CTA actions synchronized. CSS will provide a contained responsive price/action block without changing payment infrastructure.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node.js built-in test runner, Stripe Checkout API.

---

## File Structure

- Modify `shop.js`: shared card renderer, storefront renderer, product detail labels, existing cart/Stripe actions.
- Modify `programs.html`: replace duplicated static cards with one storefront render target.
- Modify `styles.css`: price row, linked cover/title, two-button layout, loading and responsive states.
- Modify `tests/checkout-flow.test.js`: regression tests for six prices, storefront rendering, labels, and direct Stripe actions.

### Task 1: Lock The Purchase UI Contract With Tests

**Files:**
- Modify: `tests/checkout-flow.test.js`

- [ ] **Step 1: Add a failing storefront and product-page regression test**

Add assertions that require:

```js
test("every program card and product page exposes price, cart, and direct purchase controls", () => {
  const shop = read("shop.js");
  const programs = read("programs.html");

  assert.match(programs, /data-program-storefront/);
  assert.match(shop, /const renderProgramStorefront/);
  assert.match(shop, /class="program-price"/);
  assert.match(shop, /data-shop-add="\$\{program\.id\}"/);
  assert.match(shop, /data-shop-buy="\$\{program\.id\}"/);
  assert.doesNotMatch(shop, />Купи сега</);
  assert.ok((shop.match(/Купи програмата/g) || []).length >= 3);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
& 'C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/checkout-flow.test.js
```

Expected: FAIL because `data-program-storefront`, `renderProgramStorefront`, and the new purchase labels do not yet exist.

- [ ] **Step 3: Commit the failing test**

```powershell
git add tests/checkout-flow.test.js
git commit -m "test: define program purchase controls"
```

### Task 2: Render All Program Cards From The Shared Catalog

**Files:**
- Modify: `programs.html`
- Modify: `shop.js`

- [ ] **Step 1: Replace duplicated storefront cards with a render target**

Replace the six hardcoded cards inside the program grid with:

```html
<div class="program-grid" data-program-storefront></div>
```

Keep the section heading and surrounding content unchanged.

- [ ] **Step 2: Update the shared card renderer**

Add a category helper before `renderProgramCard()`:

```js
const getProgramCardLabel = (program) => {
  if (program.id === "summer-program") return "Подготовка";
  if (program.id === "technical-pack") return "Основен пакет";
  if (program.id.startsWith("strength-level-")) return "Силова система";
  return "Мачова готовност";
};
```

Then change `renderProgramCard()` so the card contains:

```js
<a class="program-image program-card-link" href="${getProgramUrl(program)}">
  <img src="${getAssetPath(program)}" alt="Корица на ${program.title}" />
</a>
${program.badge ? `<span class="program-badge program-badge-featured">${program.badge}</span>` : ""}
<span class="program-label">${compact ? "Онлайн програма" : getProgramCardLabel(program)}</span>
<a class="program-title program-card-link" href="${getProgramUrl(program)}">${program.title}</a>
<div class="program-meta"><p>${program.description}</p></div>
<div class="program-purchase">
  <span class="program-price" aria-label="Цена ${program.price}">${program.price}</span>
  <div class="program-actions">
    <button class="program-cart" type="button" data-shop-add="${program.id}">Добави в количка</button>
    <button class="program-buy" type="button" data-shop-buy="${program.id}">Купи програмата</button>
  </div>
</div>
```

Preserve the featured and strength card classes by deriving them from the program id.

- [ ] **Step 3: Add the storefront renderer**

Add and call:

```js
const renderProgramStorefront = () => {
  const root = document.querySelector("[data-program-storefront]");
  if (!root) return;
  root.innerHTML = shopPrograms.map((program) => renderProgramCard(program)).join("");
};
```

Call `renderProgramStorefront()` before `renderProductDetail()` at the end of `shop.js`.

- [ ] **Step 4: Rename product detail purchase actions**

In both the product hero and final CTA, keep the existing `data-shop-add` and `data-shop-buy` attributes and change:

```html
Купи сега
```

to:

```html
Купи програмата
```

The related-program section automatically receives the same price and two-button card controls through `renderProgramCard()`.

- [ ] **Step 5: Run the focused checkout tests**

Run:

```powershell
& 'C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/checkout-flow.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit the rendering changes**

```powershell
git add programs.html shop.js tests/checkout-flow.test.js
git commit -m "feat: add purchase controls to every program"
```

### Task 3: Make Price And Actions Responsive

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Add contained purchase-block styles**

Add:

```css
.program-card-link {
  color: inherit;
  text-decoration: none;
}

.program-purchase {
  display: grid;
  gap: 12px;
  margin-top: auto;
}

.program-purchase .program-price {
  padding-top: 12px;
  border-top: 1px solid rgba(245, 196, 0, 0.2);
}

.program-actions button {
  width: 100%;
  min-width: 0;
  white-space: normal;
}

.program-actions button[disabled] {
  cursor: wait;
  opacity: 0.7;
}
```

- [ ] **Step 2: Add tablet and mobile rules**

At the existing card breakpoints, add:

```css
@media (max-width: 760px) {
  .program-actions {
    grid-template-columns: 1fr;
  }

  .program-price {
    font-size: 20px;
  }
}
```

Ensure no existing media rule overrides the card with a fixed width or causes horizontal overflow.

- [ ] **Step 3: Run all automated tests**

Run:

```powershell
& 'C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.js
```

Expected: all tests PASS.

- [ ] **Step 4: Commit the responsive styles**

```powershell
git add styles.css
git commit -m "style: refine responsive program purchase actions"
```

### Task 4: Browser Verification

**Files:**
- Verify: `programs.html`
- Verify: `programs/technical-pack/index.html`
- Verify: `cart.html`

- [ ] **Step 1: Start the local site**

Run the existing local static server on an available port and open:

```text
http://127.0.0.1:8000/programs.html#programs
```

- [ ] **Step 2: Verify the storefront at desktop and mobile widths**

Confirm:

- all six cards show `€0.50`;
- cover and title open the correct product page;
- buttons are contained with clean spacing;
- no text or controls overlap;
- the summer badge remains visible;
- mobile cards stack without horizontal scrolling.

- [ ] **Step 3: Verify cart behavior**

For each program:

- click `Добави в количка`;
- confirm the navbar count changes;
- refresh and confirm the item persists;
- open `cart.html` and confirm title, price, total, and remove action.

- [ ] **Step 4: Verify direct checkout without completing a charge**

Click `Купи програмата` on one storefront card and one product detail page. Confirm Stripe Checkout opens for the selected €0.50 product and no action opens `contact.html`.

- [ ] **Step 5: Final status and diff check**

Run:

```powershell
git status --short
git diff --check
```

Expected: no unintended files and no whitespace errors.
