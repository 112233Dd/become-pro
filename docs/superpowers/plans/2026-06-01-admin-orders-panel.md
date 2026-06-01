# Admin Orders Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a password-only private admin area at `/admin/login` and `/admin/orders` for reviewing Become Pro online-program orders.

**Architecture:** Keep the existing lightweight static-site and Vercel Functions structure. The login endpoint validates `ADMIN_PASSWORD`, issues the existing signed HttpOnly cookie, and the dashboard reads orders through the protected `/api/admin/orders` endpoint. Search and filtering stay in the browser because they operate only on the already-authorized order response.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, Node.js Vercel Functions, Supabase REST API, Stripe Checkout metadata, Node built-in test runner.

---

## File Map

- Create `admin-login.html`: password-only login page.
- Create `admin-orders.html`: protected dashboard shell.
- Create `admin-login.js`: login submission and redirect.
- Create `admin-orders.js`: authenticated order loading, filtering, search, refresh, logout, and table rendering.
- Create `tests/admin-panel.test.js`: regression coverage for routes, auth, dashboard controls, and status vocabulary.
- Modify `api/admin/login.js`: remove frontend email requirement and use the server-configured admin identity.
- Modify `api/_shared.js`: accept and expose the `expired` status consistently.
- Modify `api/stripe/webhook.js`: write `expired` for expired Checkout Sessions.
- Modify `supabase/schema.sql`: allow `expired` in the orders status constraint.
- Modify `styles.css`: style login, filters, refresh control, empty state, error state, and responsive table containment.
- Modify `vercel.json`: add `/admin/login` and `/admin/orders` rewrites and redirect `/admin` to the dashboard route.
- Delete `admin.html`: replace the combined public shell with focused login and dashboard pages.
- Delete `admin.js`: replace the combined script with focused login and dashboard scripts.

### Task 1: Add failing admin route and password-only login tests

**Files:**
- Create: `tests/admin-panel.test.js`

- [ ] **Step 1: Add tests for the new route and login contract**

Use `node:test`, `node:assert/strict`, `fs`, and a small mocked request/response helper. Assert:

```js
assert.match(vercelConfig, /"source": "\/admin\/login"/);
assert.match(vercelConfig, /"source": "\/admin\/orders"/);
assert.match(loginHtml, /name="password"/);
assert.doesNotMatch(loginHtml, /name="email"/);
assert.match(loginApi, /process\.env\.ADMIN_PASSWORD/);
assert.doesNotMatch(loginApi, /body\.email/);
```

- [ ] **Step 2: Run the test and confirm the expected failure**

Run:

```powershell
node --test tests/admin-panel.test.js
```

Expected: FAIL because `/admin/login`, `/admin/orders`, and the password-only page do not exist yet.

- [ ] **Step 3: Commit the failing tests**

```powershell
git add tests/admin-panel.test.js
git commit -m "test: define admin orders panel behavior"
```

### Task 2: Split the admin pages and implement password-only authentication

**Files:**
- Create: `admin-login.html`
- Create: `admin-login.js`
- Create: `admin-orders.html`
- Create: `admin-orders.js`
- Modify: `api/admin/login.js`
- Modify: `vercel.json`
- Delete: `admin.html`
- Delete: `admin.js`

- [ ] **Step 1: Create `/admin/login`**

Build a Become Pro dark login card with a single password input:

```html
<form class="admin-login-card" data-admin-login>
  <label>Парола<input type="password" name="password" required autocomplete="current-password" /></label>
  <button class="btn btn-primary" type="submit">Вход</button>
  <p class="form-status" data-admin-status aria-live="polite"></p>
</form>
```

Submit only `{ password }` and redirect successful logins to `/admin/orders`.

- [ ] **Step 2: Update the server login endpoint**

Read `body.password`, require `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `ADMIN_EMAIL`, then issue:

```js
const token = signAdminToken({
  email: process.env.ADMIN_EMAIL,
  exp: Date.now() + 1000 * 60 * 60 * 8,
});
```

Reject invalid passwords with HTTP `401`.

- [ ] **Step 3: Add dashboard routes**

Configure:

```json
{ "source": "/admin", "destination": "/admin/orders" },
{ "source": "/admin/login", "destination": "/admin-login.html" },
{ "source": "/admin/orders", "destination": "/admin-orders.html" }
```

- [ ] **Step 4: Run the tests**

Run:

```powershell
node --test tests/admin-panel.test.js
```

Expected: route and login contract assertions PASS.

- [ ] **Step 5: Commit**

```powershell
git add admin-login.html admin-login.js admin-orders.html admin-orders.js api/admin/login.js vercel.json admin.html admin.js
git commit -m "feat: split protected admin login and orders pages"
```

### Task 3: Build the searchable and filterable orders dashboard

**Files:**
- Modify: `admin-orders.html`
- Modify: `admin-orders.js`
- Modify: `styles.css`
- Modify: `tests/admin-panel.test.js`

- [ ] **Step 1: Add failing dashboard structure assertions**

Assert that the dashboard contains:

```js
assert.match(ordersHtml, /data-admin-search/);
assert.match(ordersHtml, /data-admin-filter/);
assert.match(ordersHtml, /data-admin-refresh/);
assert.match(ordersHtml, /data-admin-empty/);
assert.match(ordersHtml, /Stripe Session ID/);
assert.match(ordersHtml, /Program Link/);
```

- [ ] **Step 2: Run the tests and confirm failure**

Run:

```powershell
node --test tests/admin-panel.test.js
```

Expected: FAIL because dashboard controls are not fully implemented.

- [ ] **Step 3: Implement dashboard behavior**

Maintain:

```js
let allOrders = [];
let selectedStatus = "all";
let searchTerm = "";
```

Filter by `payment_status`, then search normalized customer name, email, and program name. Render the exact approved columns. On HTTP `401`, redirect with:

```js
window.location.replace("/admin/login");
```

Render `Все още няма поръчки.` when the authorized result is empty. Show a clear load error without exposing server internals.

- [ ] **Step 4: Add responsive styles**

Keep the table within `.admin-table-wrap { overflow-x: auto; }`, add compact controls, and style statuses:

```css
.status-paid { background: rgba(98, 214, 122, 0.9); }
.status-pending { background: #e6d4a8; }
.status-failed,
.status-expired { color: var(--white); background: rgba(255, 85, 85, 0.7); }
```

- [ ] **Step 5: Run the tests**

Run:

```powershell
node --test tests/admin-panel.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add admin-orders.html admin-orders.js styles.css tests/admin-panel.test.js
git commit -m "feat: add searchable admin orders dashboard"
```

### Task 4: Normalize expired Stripe orders

**Files:**
- Modify: `api/_shared.js`
- Modify: `api/stripe/webhook.js`
- Modify: `supabase/schema.sql`
- Modify: `tests/admin-panel.test.js`

- [ ] **Step 1: Add failing expired-status assertions**

Assert:

```js
assert.match(sharedApi, /"expired"/);
assert.match(webhookApi, /status: "expired"/);
assert.match(schema, /'expired'/);
```

- [ ] **Step 2: Run the test and confirm failure**

Run:

```powershell
node --test tests/admin-panel.test.js
```

Expected: FAIL because the existing code stores expired sessions as `cancelled`.

- [ ] **Step 3: Update status handling**

Add `expired` to `ORDER_STATUSES`, map Stripe expired sessions to `expired`, and update the Supabase schema constraint. Preserve existing `cancelled` compatibility for older records.

- [ ] **Step 4: Run tests**

Run:

```powershell
node --test tests/admin-panel.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add api/_shared.js api/stripe/webhook.js supabase/schema.sql tests/admin-panel.test.js
git commit -m "fix: report expired Stripe orders consistently"
```

### Task 5: Verify the admin flow end to end

**Files:**
- Verify only

- [ ] **Step 1: Run automated tests**

Run:

```powershell
node --test tests/admin-panel.test.js
```

Expected: PASS with no failing tests.

- [ ] **Step 2: Start the local Vercel-compatible server**

Run the project with the local Vercel development server so `/api/admin/*` works.

- [ ] **Step 3: Verify unauthenticated behavior**

Open `/admin/orders`. Confirm redirect to `/admin/login`.

- [ ] **Step 4: Verify authenticated behavior**

Enter an invalid password and confirm the visible error. Enter the configured local admin password and confirm redirect to `/admin/orders`.

- [ ] **Step 5: Verify dashboard interactions**

Confirm table rendering, search, all status filters, refresh, logout, empty state, and horizontal containment at laptop width.

- [ ] **Step 6: Run a final workspace review**

Run:

```powershell
git status --short
git diff --check
```

Expected: only intentional changes; no whitespace errors.

