# Localization & RTL

Multi-language support with automatic RTL, driven entirely from the database — no lang-file editing required to add a language, and the whole feature stays invisible until you actually add a second one.

## Languages (Backoffice → Languages)

Backed by `App\Models\Language` — code, name, native name, direction (`ltr`/`rtl`), active flag, primary flag, display order. Managed exclusively from `/languages` in the backoffice, gated by `languages.*` permissions, which are **Super-Admin-only** — Admin never gets them, the same way `permissions.*` is locked down (see [Roles & Permissions](/guide/roles-and-permissions)).

- Exactly one language is primary at a time — making one primary demotes whichever held it before (`Language::booted()`'s `saving` hook).
- The primary language can't be deactivated or deleted without promoting another first.
- Reorder with the up/down arrows — this is display order in the switcher, not priority.

```
Fewer than 2 active languages?
        │
       yes ──► Switcher hidden everywhere. Locale forced to
       │        the single active (or primary) language.
       no
        │
        ▼
Multi-language UI live — see resolution order below.
```

That count check is `App\Services\LanguageService::isMultiLanguageEnabled()`, used both by the switcher component and `SetLocale` middleware.

## RTL

Direction comes straight from the `Language` row, not a hardcoded list — `LanguageService::currentDirection()` feeds `<html dir="...">` on all 7 layouts (`accounts`, `app`, `auth`, `backoffice`, `errors`, `landing` + landing's own error page).

The whole UI uses Tailwind's logical properties (`ps-`/`pe-`, `ms-`/`me-`, `border-s`/`border-e`, `text-start`/`text-end`) instead of physical ones (`pl-`/`pr-`, `ml-`/`mr-`, etc.) — flipping `dir` flips the whole layout with zero `rtl:` variants needed. The handful of genuinely directional icons (back arrows, the logout icon, "continue" arrows) use `rtl:rotate-180` since a mirrored icon isn't something a CSS logical property can express.

If you add new views, follow the same convention — physical Tailwind spacing/border/text-align utilities will silently *not* flip under RTL.

## Locale resolution

Two different rulebooks apply, split by portal:

### `app` / `account` / `backoffice`

**The signed-in user's saved preference is the only thing that matters.** Set from the Account portal's Preferred Language field (`/settings` → `users.locale` column), it wins regardless of anything in the URL. There's no switcher on these three layouts on purpose — there's nothing to switch, short of changing that setting.

Consequently, **neither `?lang=` nor a `/xx` path segment work on these three portals at all** — `routes/web.php` never registers a locale-prefixed URI for them, and `SetLocale` middleware explicitly ignores `?lang=` there too (a query string reaches the middleware regardless of routing, so it needs blocking explicitly).

### `landing` / `auth`

Guest-facing, so the URL is in control. Resolution order:

1. **Explicit URL** — `?lang=` or `/xx`, whichever [URL mode](#url-mode) is active. Wins for everyone, signed in or not.
2. **Signed-in user's saved preference** — only as a *default* when there's no URL signal, not a lock. A logged-in visitor casually on the marketing site still sees their language, but the switcher always overrides it for that visit.
3. **Session** — sticky across requests once resolved by any of the above.
4. **`Accept-Language` header** — via `Request::getLanguages()`/`getPreferredLanguage()`. Note: `getPreferredLanguage()` never actually returns `null` — with no header at all it silently returns the *first* candidate you pass it, not necessarily the primary language. `SetLocale` checks `getLanguages()` for emptiness first to avoid that trap.
5. **Primary language** — the final fallback.

All of this lives in `App\Http\Middleware\SetLocale`, appended globally in `bootstrap/app.php` (before `CheckMaintenance`).

## URL mode (Backoffice → Settings)

Two mutually-exclusive URL styles, picked from `/settings` (`languages.edit` permission, same Super-Admin-only gate as the Languages page), backed by `App\Models\LocaleSetting` (a single-row table):

| Mode | Shape | Notes |
|---|---|---|
| **Path prefix** (default) | `example.com/` (primary) · `example.com/ar` · `example.com/ta` | `routes/web.php` recomputes the prefix from the current request's first URI segment on every request and folds it into landing/auth's route groups — `route()` calls anywhere in the app then generate correctly-prefixed links automatically. The primary language never gets a prefix. |
| **Query string** | `example.com/?lang=ar` | No prefixed routes are registered at all while this mode is active — a stray `/ar` genuinely 404s. |

Only one is ever honored — switching modes doesn't leave the other one silently still working. The switcher component (`<x-locale-switcher />`) asks `LanguageService::switchUrl()` which mode is live and builds the right link shape; it never hardcodes either.

## Switcher component

`<x-locale-switcher />` — standalone, not wired into every layout by design. Self-hides under 2 active languages. Included on `landing` and `auth` (header/floating corner respectively); deliberately **not** on `app`/`account`/`backoffice` (see [above](#app-account-backoffice)). Drop it into your own views wherever a guest-facing page needs manual language control.

## Translations (Backoffice → Translations)

`spatie/laravel-translation-loader` backs every hardcoded `__('...')` string and validation message with a database override, with **zero refactor of existing views** — normal flat-text `__('Some string')` calls and `validation.*` keys keep working exactly as before; the loader just lets the database win when a translation exists, falling back to the file/hardcoded string otherwise. No duplication: you only ever add the rows you actually want translated.

Rows live in `App\Models\LanguageLine` (extends the package's model), with one addition — a `scope` column purely for the backoffice UI and permissions, with **no effect on actual translation resolution** (that's still driven by Laravel's own `group`/`key`):

| Scope | Route | Permission | Notes |
|---|---|---|---|
| Landing | `/translations` (default) | `translations.landing` | Assignable to Admin |
| Portal | `/translations/portal` | `translations.portal` | Assignable to Admin — app/account/backoffice-only copy |
| Common | `/translations/common` | `translations.common` | **Super-Admin-only** — words reused across every scope, so editing them affects landing and portal wording at once |

Each scope is a real route (not a client-side tab), 404s on an unknown scope, 403s if you lack that scope's permission, and defaults to your first permitted scope if you land on `/translations` without one. The page has key/value search (`wire:model.live.debounce.300ms`, same pattern as the Users page) — it's a substring match against the raw JSON `text` column, not a precise per-locale lookup.

Adding a line: pick **Text** (Laravel's flat `__()` group, `*`) or **Validation** (overrides a validator message like `required` or `custom.email.required`), type the key exactly as it appears in code, fill in whichever active languages you want to override.
