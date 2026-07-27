# App

The main authenticated application, served on `app.APP_MAIN_DOMAIN`.

- Route file: `routes/app.php`
- Layout: `resources/views/layouts/app.blade.php`
- Pages: `resources/views/pages/app/`
- CSS/JS: `resources/css/app.css`, `resources/js/app.js`

## Dashboard

`/` → `pages::app.dashboard`

**This is placeholder demo content**, not real data — hard-coded stat cards (revenue, active users, open orders, conversion rate), a fake 7-day activity chart, and a fake recent-activity feed, all meant to stand in for whatever your actual product does. Replace `resources/views/pages/app/⚡dashboard/dashboard.php` and its Blade view with your own logic.

## Access control

Wrapped in `['auth', 'phone.verified', 'email.grace', 'portal:user']`. The `portal:user` alias is `App\Http\Middleware\EnsurePortalAccess` — it redirects staff users to `backoffice.dashboard` instead, keeping end-users and staff in their own portal. This is the core, reusable mechanism (see [Config Reference](/reference/config)); `phone.verified` and `email.grace` are demo-specific and live in `App\Http\Middleware\Demo\`.
