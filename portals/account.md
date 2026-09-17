# Account

Authenticated self-service area, served on `account.APP_MAIN_DOMAIN`, wrapped in `auth` middleware.

- Route file: `routes/account.php`
- Layout: `resources/views/layouts/accounts.blade.php`
- Pages: `resources/views/pages/accounts/` — profile, security, data export, 2FA setup
- CSS/JS: `resources/css/account.css`, `resources/js/account.js`

Both end users and staff can access this portal — there's no `portal:*` middleware restriction here, unlike `app`/`backoffice`.

## Profile

`/` → `pages::accounts.index`

Inline-edit sections, one open at a time:

- **Name** — saves immediately, no re-verification.
- **Email** — doesn't change on save. See [Changing your email address](/portals/auth#changing-your-email-address) for the pending/verify-link flow. You can cancel a pending change or resend the link from here.
- **Phone** — only shown if phone verification is enabled. Saving clears the current verification, sends a fresh OTP, and redirects to `/verify-phone`.
- **Delete account** — requires re-entering your current password. See [Account deletion](#account-deletion) below.

## Security

`/security` → `pages::accounts.security`

**Password** — change your password with current-password confirmation.

**Login sessions** — every active session for your account, read straight from the `sessions` table: device/browser (parsed from the user-agent), IP, last-active time, with the current session flagged. Two actions:

- **Log out** a single other session.
- **Log out other sessions** — logs out everything except the device you're on now.

Both rotate your `remember_token`, so a "remember me" cookie sitting in a logged-out browser can't silently log itself back in. If your *current* browser also has a remember cookie, it's transparently reissued so you stay logged in.

## Data export

`/export` → `pages::accounts.export`

- **Request an export** — queues a background job that builds a zip (`profile.csv` + `sessions.csv`) and emails you a link when it's ready.
- **Download** — clicking the link takes you back to this page, where you re-enter your current password to generate a one-time download token (valid 60 seconds). The actual file is served from `GET /export/{token}` on the account domain (registered directly in `routes/web.php`, not `routes/account.php` — deliberately outside `auth` middleware, since the link may be opened from an email client with no active session).
- Exports expire and get pruned automatically **7 days** after they're generated.
- Downloads are capped at **3 per 24 hours** per account.

## Account deletion

Triggered from the [Profile](#profile) page, re-entering your password.

- Requesting deletion **immediately logs you out everywhere** (all sessions revoked) and schedules permanent deletion **30 days** out. You get an email confirming the date.
- **To cancel**: just log back in during those 30 days — logging in (or completing a 2FA challenge) automatically cancels a pending deletion and sends you a cancellation email. There's no separate "cancel" button once you're logged out, since requesting deletion ends your session immediately.
- After 30 days, a scheduled job processes the request: your account isn't hard-deleted (so foreign keys/audit trails stay intact) — it's **anonymized** instead. Name becomes "Deleted User", email becomes an unreachable placeholder, phone/2FA/password are wiped, and the request is marked completed.

## Two-factor authentication

`/two-factor-setup` (requires `auth`, `phone.verified`)

- **Setup** — scan a QR code with any TOTP authenticator app (Google Authenticator, Authy, etc.), confirm with a 6-digit code. On success, 8 single-use recovery codes are generated — save these somewhere safe.
- **Manage** — once enabled, this page lets you view/hide recovery codes, regenerate a fresh set (invalidating the old ones), reconfigure (new QR code), or disable 2FA entirely.
- Recovery codes are consumed permanently once used at the [2FA challenge](/portals/auth#two-factor-authentication) during login.

## Preferred language

`/settings` → `pages::accounts.settings`

Only shown once 2+ languages are active (see [Localization & RTL](/guide/localization)). Whatever you pick here is authoritative on `app`, `account`, and `backoffice` from then on — it overrides everything else, including `?lang=` if you happen to have it in the URL, and there's no switcher on those three portals for exactly that reason. Saving redirects (full page load, not a Livewire SPA swap) so `<html dir>` and everything else baked into the initial render picks up the change immediately.

## Timezone

Same `/settings` page, its own card — always shown (not gated behind anything, unlike Preferred language). Picks a `users.timezone` value used to display every date/time you see across the app in your local time instead of the server's UTC storage; falls back to the backoffice's global default timezone if left unset. See [Localization & RTL → Timezones](/guide/localization#timezones) for how conversion works under the hood. Saving here just flashes a status message — no redirect needed, since it doesn't affect anything baked into the initial render the way locale does.

## Scheduled cleanup

Two jobs run daily (`routes/console.php`), no setup needed beyond a working queue + scheduler:

| Job | Schedule | What it does |
|---|---|---|
| `ProcessPendingAccountDeletions` | 02:00 daily | Finds deletion requests past their 30-day date and processes them |
| `PruneAccountExports` | 03:00 daily | Deletes expired export files + their DB rows |
