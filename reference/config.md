# Config Reference

## `config/multidomain.php`

| Key | Env | Default | Purpose |
|---|---|---|---|
| `main_domain` | `APP_MAIN_DOMAIN` | `localhost` | Base domain every portal is derived from |
| `single_domain` | `APP_SINGLE_DOMAIN` | `false` | Collapse all portals onto `main_domain` — see [Single vs Multi Domain](/guide/single-vs-multi-domain) |
| `sub_domains` | — | derived | Array of portal key → resolved domain (`app`, `backoffice`, `landing`, `account`, `auth`, `api`) |
| `registerable_portals` | — | `[]` | Portal roles a visitor can self-select on the public register page — see [make:subdomain § self-registration](/guide/make-subdomain-command#self-registration) |

## Demo auth settings (`config/multidomain.php`)

Settings for the worked example auth flow — see the [Auth portal](/portals/auth) for how each is used. Not part of the core multidomain routing.

| Key | Env | Default | Purpose |
|---|---|---|---|
| `email_verification_grace_days` | `EMAIL_VERIFICATION_GRACE_DAYS` | `7` | Days before an unverified email hard-blocks `app`/`backoffice` access |
| `phone_verification_enabled` | `PHONE_VERIFICATION_ENABLED` | `false` | Turns the entire phone/OTP flow on or off. When off, phone fields, gates, and account settings all behave as if verified |
| `phone_country_mode` | `PHONE_COUNTRY_MODE` | `single` | `single` = one fixed country code, no field shown; `multi` = free-text country code, no real validation |
| `phone_default_country_code` | `PHONE_DEFAULT_COUNTRY_CODE` | `+91` | Fixed code used in `single` mode |
| `otp.expires_minutes` | `OTP_EXPIRES_MINUTES` | `10` | How long a generated OTP stays valid |
| `otp.max_attempts` | — | `5` | Wrong-code attempts before a 5-minute verify lockout |
| `otp.resend_cooldown` | — | `60` (seconds) | Minimum wait between resends |
| `otp.resend_max_attempts` | — | `3` | Resends allowed per lockout window |
| `otp.resend_lockout_seconds` | — | `86400` | Window before resend attempts reset |

## Portal → role mapping

`App\Http\Middleware\EnsurePortalAccess` (alias `portal:{user|staff}`) redirects a request to the correct portal if the authenticated user's role doesn't match. It relies on two methods on your user model:

```php
$user->isStaff(): bool
$user->redirect(): string   // route name/URL to send a mismatched user to
```

`App\Models\User` implements both today via a `privilege` column — swap these out for your own role system, the middleware doesn't care how they're implemented.

## Core vs demo middleware

Registered in `bootstrap/app.php`:

| Alias | Class | |
|---|---|---|
| `guest` | `App\Http\Middleware\RedirectIfAuthenticated` | core |
| `portal` | `App\Http\Middleware\EnsurePortalAccess` | core |
| `phone.verified` | `App\Http\Middleware\Demo\EnsurePhoneIsVerified` | demo/example |
| `email.grace` | `App\Http\Middleware\Demo\EnsureEmailVerificationNotExpired` | demo/example |
| `staff` | `App\Http\Middleware\Demo\EnsureIsStaff` | demo/example |

The "demo" ones implement this starter kit's worked example (phone OTP + email grace period) — replace or delete them for your own app; they're not required for the portal/subdomain mechanism itself.
