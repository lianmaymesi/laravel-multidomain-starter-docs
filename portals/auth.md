# Auth

Guest-facing authentication flows, served on `auth.APP_MAIN_DOMAIN`.

- Route file: `routes/auth.php`
- Layout: `resources/views/layouts/auth.blade.php`
- Pages: `resources/views/pages/auth/`
- CSS/JS: `resources/css/auth.css`, `resources/js/auth.js`

Everything on this page is **demo functionality** — a fully worked example of login, registration, password reset, phone/email verification, and two-factor auth. Keep what you need, delete or replace the rest; none of it is required for the multidomain routing itself.

## Login

`/login` → `pages::auth.login`

- Email + password, with a "Remember me for 30 days" checkbox.
- 5 failed attempts (keyed by `email|ip`) trigger a 5-minute lockout.
- On success, in order:
  1. Phone not verified (and phone verification is enabled) → sends an OTP, redirects to [phone verification](#phone-verification).
  2. Two-factor enabled → redirects to the [2FA challenge](#two-factor-authentication).
  3. User has a pending account deletion still inside its cancel window → auto-cancels it and redirects to the account portal.
  4. Otherwise → redirected by role, see [Config Reference](/reference/config).

## Register

`/register` → `pages::auth.register`

- Name, email, password/confirm.
- **"Select the user type" dropdown** only appears if `config('multidomain.registerable_portals')` is non-empty — see [make:subdomain](/guide/make-subdomain-command#self-registration). Picking one assigns that role immediately, which is what routes the new user to their own portal after login.
- **Phone number field** only appears if `phone_verification_enabled` is on (see below).

## Forgot / reset password

`/forgot-password` → `/reset-password/{token}`

- Two-step flow with a Phone / Email tab switch (phone tab hidden if phone verification is disabled) — request a 6-digit OTP, then enter it.
- Always shows the same "sent" confirmation whether or not the address/number matches a real account, to avoid leaking which emails/phones are registered.
- A verified OTP exchanges for a standard Laravel password-reset token, which lands you on `/reset-password/{token}` to set a new password.
- Resend has a live cooldown countdown.

## Phone verification

`/verify-phone` (requires `auth`)

Only relevant if `phone_verification_enabled` is on — see [Config Reference](/reference/config#phone-verification). When it's off, this whole flow is skipped everywhere (registration, middleware, account settings all treat the phone as verified).

- 6-digit OTP sent via SMS (Twilio).
- Resend limited to 2 attempts.
- Inline "edit phone number" limited to 2 attempts, and re-sends the OTP to the new number.
- On success, continues to 2FA challenge if enabled, otherwise straight to the user's portal.

### OTP rules

Configured in `config/multidomain.php` under `otp`:

| Key | Default | Behavior |
|---|---|---|
| `resend_cooldown` | 60s | Minimum wait between resends |
| `resend_max_attempts` | 3 | Resends allowed per lockout window |
| `resend_lockout_seconds` | 86400 (24h) | Window before resend attempts reset |
| `max_attempts` | 5 | Wrong-code attempts before a 5-minute verify lockout |
| `expires_minutes` | 10 | How long a generated code stays valid |

Requesting a new OTP invalidates any previous unused one of the same type. If Twilio isn't configured (`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_PHONE_NUMBER`), sending fails silently (logged, not thrown) — set these in `.env` to actually receive SMS.

## Email verification

`/verify-email` (requires `auth`, `phone.verified`)

- A grace period (`EMAIL_VERIFICATION_GRACE_DAYS`, default 7) lets a user use the app before verifying — the page shows days remaining. After the deadline, `email.grace` middleware hard-blocks access to `app`/`backoffice` and redirects here.
- Same 6-digit OTP + resend mechanism as phone verification.

## Changing your email address

Not a page of its own — triggered from the [Account profile page](/portals/account#profile). Changing your email doesn't take effect immediately:

1. The new address is stored as `pending_email` and a verification link is emailed to it.
2. Your **current** email stays active (and you stay logged in) until that link is clicked.
3. Clicking `/verify-email-change/{token}` (no `auth` middleware — it's a standalone signed link, so it works from an email client with no active session) applies the change. The link expires after 48 hours.

## Two-factor authentication

Setup lives on the [Account portal](/portals/account#two-factor-authentication); the challenge below is what a 2FA-enabled user sees on every login.

`/two-factor-challenge` (only reachable mid-login, via a session flag set by Login)

- Enter a 6-digit TOTP code, or switch to a one-time recovery code.
- Recovery codes are single-use — each is removed from the account once used.
- On success: same auto-cancel-pending-deletion + role-based redirect as a normal login.

See the [Account portal](/portals/account#two-factor-authentication) for setting 2FA up, viewing/regenerating recovery codes, and disabling it.

## Config toggles that affect this portal

| Config | Env | Default | Effect |
|---|---|---|---|
| `multidomain.phone_verification_enabled` | `PHONE_VERIFICATION_ENABLED` | `false` | Turns the entire phone/OTP flow on or off app-wide |
| `multidomain.phone_country_mode` | `PHONE_COUNTRY_MODE` | `single` | `single` auto-applies one fixed country code (no country field shown); `multi` lets the user type their own (free text, no validation against a real country list) |
| `multidomain.phone_default_country_code` | `PHONE_DEFAULT_COUNTRY_CODE` | `+91` | The fixed code used in `single` mode |
| `multidomain.email_verification_grace_days` | `EMAIL_VERIFICATION_GRACE_DAYS` | `7` | Days before unverified email hard-blocks access |
| `multidomain.registerable_portals` | — | `[]` | Portals a visitor can self-select on the register page |

## Language switcher

A floating switcher (top corner, since this portal's pages have no shared header chrome) — same rules as [Landing](/portals/landing#language-switcher). See [Localization & RTL](/guide/localization).

## Portal redirect

Already-authenticated users hitting this subdomain get redirected to their portal by `App\Http\Middleware\RedirectIfAuthenticated` (the `guest` middleware alias), which checks phone verification state and then calls `$user->redirect()` — see [Config Reference](/reference/config) for how that maps roles to portals.
