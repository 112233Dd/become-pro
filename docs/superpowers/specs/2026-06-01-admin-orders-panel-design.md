# Admin Orders Panel Design

## Goal

Add a private Become Pro admin area where the site owner can sign in with one password and review online-program orders without exposing payment secrets or card data.

## Routes

- `/admin` redirects to `/admin/orders`.
- `/admin/login` shows a simple password-only login form.
- `/admin/orders` shows the protected orders dashboard.
- `/api/admin/login` validates the submitted password server-side.
- `/api/admin/logout` clears the admin session.
- `/api/admin/orders` returns order data only for an authenticated admin session.

## Authentication

- The login form contains one password field.
- The expected password is read only from `ADMIN_PASSWORD`.
- A successful login creates the existing signed `bp_admin` HttpOnly session cookie.
- The cookie remains `SameSite=Lax`, uses `Secure` in production, and expires after eight hours.
- The session signature is generated with `ADMIN_SESSION_SECRET`.
- If the session is missing or invalid, `/admin/orders` redirects the browser to `/admin/login`.

The static dashboard shell contains no order data. Orders are loaded only through the protected server-side endpoint.

## Orders Dashboard

The dashboard uses the Become Pro dark visual language with yellow accents and a clear laptop-friendly layout.

It includes:

1. A compact page header and logout button.
2. A search input for customer name, email, or program.
3. A status filter with `All`, `Paid`, `Pending`, `Failed`, and `Expired`.
4. A `Refresh orders` button.
5. A responsive table with:
   - Date
   - Customer name
   - Email
   - Phone
   - Program
   - Price
   - Status
   - Stripe Session ID
   - Program Link
6. An empty state: `Все още няма поръчки.`
7. A clear error state if orders cannot be loaded.

On narrower laptop screens, the table stays contained inside a horizontally scrollable panel instead of breaking the page layout.

## Status Presentation

- `paid`: green status styling.
- `pending`: yellow status styling.
- `failed`: muted red status styling.
- `expired`: muted red status styling.

Filtering and searching happen in the browser after the protected API response is received. Refresh requests the latest order list from the server.

## Data Source

The dashboard consumes the existing Orders logic and displays only order fields:

- `id`
- `customerName`
- `customerEmail`
- `customerPhone`
- `programId`
- `programName`
- `programPrice`
- `programLink`
- `paymentStatus`
- `stripeCheckoutSessionId`
- `stripePaymentIntentId`
- `createdAt`
- `updatedAt`

The Stripe webhook remains responsible for writing and updating order status. The dashboard is read-only.

## Security Boundaries

- No password is hardcoded in HTML or JavaScript.
- No Stripe secret key, webhook secret, or bank/card data reaches the browser.
- The orders API verifies the signed admin cookie before returning data.
- The dashboard displays only the approved order fields.
- The admin password and session secret are configured through environment variables.

## Verification

1. Opening `/admin/orders` without a valid session redirects to `/admin/login`.
2. Incorrect passwords show a clear login error.
3. A correct password opens `/admin/orders`.
4. The orders table renders the expected columns.
5. Search, status filters, refresh, and logout work.
6. Empty and failed-load states render correctly.
7. The panel remains contained on laptop and narrower viewports.

