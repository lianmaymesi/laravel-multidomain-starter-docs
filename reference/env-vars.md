# Environment Variables

## Multidomain

| Var | Default | Purpose |
|---|---|---|
| `APP_MAIN_DOMAIN` | `localhost` | Base domain (e.g. `yourapp.test`) |
| `APP_SINGLE_DOMAIN` | `false` | Collapse all portals onto one host |
| `SESSION_DOMAIN` | `null` | Shared session cookie domain for SSO, e.g. `.yourapp.test`. Leave `null` in single-domain mode |
| `APP_MAINTENANCE` | `false` | Global maintenance kill switch — takes down every portal, backoffice included. See [Maintenance Mode](/guide/maintenance-mode) |

## Demo auth feature

Not required by the starter kit core — only relevant if you keep the phone-verification / OTP demo flow. See the [Auth portal](/portals/auth) for how each is used.

| Var | Default | Purpose |
|---|---|---|
| `PHONE_VERIFICATION_ENABLED` | `false` | Turn the phone/OTP flow on. Off by default — leave off if you don't need it |
| `PHONE_COUNTRY_MODE` | `single` | `single` (fixed code) or `multi` (free-text code) |
| `PHONE_DEFAULT_COUNTRY_CODE` | `+91` | Fixed country code used in `single` mode |
| `EMAIL_VERIFICATION_GRACE_DAYS` | `7` | Days before unverified email hard-blocks access |
| `OTP_EXPIRES_MINUTES` | `10` | How long a generated OTP stays valid (also shown in the SMS/email text sent to the user) |
| `TWILIO_ACCOUNT_SID` | — | Twilio account SID, required to actually send OTP SMS |
| `TWILIO_AUTH_TOKEN` | — | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | — | Sending number for OTP SMS |

Without Twilio credentials set, SMS sends fail silently (logged, not thrown) — fine for local dev where you don't need real texts, but phone verification won't be reachable by an actual user until these are set.

See `.env.example` for the full list of standard Laravel env vars (database, mail, queue, etc.) — unchanged from a standard Laravel install.
