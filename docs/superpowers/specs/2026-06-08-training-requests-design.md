# Training Requests Design

## Goal

Convert the public request form into a short form used only for individual
training enquiries. Store every enquiry in Supabase, notify the admin by
email, and manage the enquiry status from the protected admin panel.

## Public Form

The form contains only:

- applicant type: "Моето дете" or "Себе си"
- name
- city
- phone

The submit button reads "Запази място". A privacy note explains that the data
is used only to contact the applicant about individual training.

The browser submits JSON to `POST /api/training-requests`. The API validates
the values, stores a row in `training_requests`, sends an admin notification,
and returns success. The page then shows the exact success message requested
by the owner.

Online program controls remain separate from this form and continue to use
program pages, cart, and Stripe Checkout.

## Data Model

`training_requests` contains:

- `id`
- `created_at`
- `applicant_type`
- `name`
- `city`
- `phone`
- `status`

Allowed statuses:

- `new`
- `contacted`
- `booked`
- `declined`

Bulgarian labels in the interface:

- Нова
- Свързан
- Записан
- Отказан

## Admin Panel

The existing protected orders page receives a separate section titled
"Заявки за индивидуални тренировки".

It provides:

- date and time
- applicant type
- name
- city
- phone
- status selector
- search
- status filter
- refresh
- empty and error states

The admin API requires the existing signed admin cookie. `GET` lists requests
and `PATCH` validates and persists a status change.

## Security

- The Supabase service role key is used only in server-side API functions.
- Public input is validated and length-limited.
- The admin list and status update require a valid admin session.
- No online-program purchase path is connected to the request form.

## Verification

- Automated tests cover the reduced form, public API validation and insert,
  protected admin API, status updates, admin controls, and navigation rules.
- Browser checks cover successful form submission, mobile layout, admin list,
  and status changes.
