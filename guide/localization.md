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

Two mutually-exclusive URL styles, picked from `/settings` (`languages.edit` permission, same Super-Admin-only gate as the Languages page), backed by `App\Models\AppSetting` — a generic key/value table (`app_settings`: `key`, `value`) for app-wide settings in general, not just this one. `url_mode` is just one key in it (`AppSetting::urlMode()` / `isPathMode()` / `isQueryMode()`); the [default timezone](#timezones) is another. Add new global settings the same way — `AppSetting::get()`/`set()` — rather than a new dedicated table per setting.

| Mode | Shape | Notes |
|---|---|---|
| **Path prefix** (default) | `example.com/` (primary) · `example.com/ar` · `example.com/ta` | `routes/web.php` recomputes the prefix from the current request's first URI segment on every request and folds it into landing/auth's route groups — `route()` calls anywhere in the app then generate correctly-prefixed links automatically. The primary language never gets a prefix. |
| **Query string** | `example.com/?lang=ar` | No prefixed routes are registered at all while this mode is active — a stray `/ar` genuinely 404s. |

Only one is ever honored — switching modes doesn't leave the other one silently still working. The switcher component (`<x-locale-switcher />`) asks `LanguageService::switchUrl()` which mode is live and builds the right link shape; it never hardcodes either.

## Switcher component

`<x-locale-switcher />` — standalone, not wired into every layout by design. Self-hides under 2 active languages. Included on `landing` and `auth` (header/floating corner respectively); deliberately **not** on `app`/`account`/`backoffice` (see [above](#app-account-backoffice)). Drop it into your own views wherever a guest-facing page needs manual language control.

## Timezones

Storage stays UTC everywhere (`config('app.timezone')` is never touched) — conversion only ever happens at display time, through a `Carbon::macro('forUser')` registered in `AppServiceProvider::boot()`:

```php
$user->created_at->forUser()->translatedFormat('l, d F Y H:i')
```

`forUser()` resolves through `App\Services\TimezoneService::current()`: the given user's `users.timezone` column, falling back to the app-wide default (`AppSetting::defaultTimezone()`, itself falling back to `config('app.timezone')` if never set) if the user hasn't picked one, or if there's no signed-in user at all.

- **Global default** — Backoffice → Settings (`settings.edit` permission), a plain timezone identifier picked from `DateTimeZone::listIdentifiers()`.
- **Per-user override** — Account → Settings, next to Preferred language. Always shown (unlike the language card, which needs 2+ active languages) — a timezone preference is useful even on a single-language install.

No trait, no per-model opt-in — the macro attaches to every `Carbon`/`CarbonImmutable` instance in the app for free, the same way `now()` or a model's date cast already does.

### Date translation

`Carbon::setLocale()` is kept in sync with the active language in `SetLocale` middleware, right after `LaravelLocalization::setLocale()`. That's the entire mechanism — `translatedFormat()` and `diffForHumans()` already localize month/day names and relative phrasing ("2 days ago") once Carbon's locale matches, for any locale Carbon ships translations for (`ar`, `ta`, `te`, and ~280 others — check `vendor/nesbot/carbon/src/Carbon/Lang/`). This is calendar-agnostic: dates render in the Gregorian calendar with translated text, not converted to Hijri/Buddhist/other calendar systems — that's a different, unimplemented feature.

## Translations (Backoffice → Translations)

`spatie/laravel-translation-loader` backs every hardcoded `__('...')` string and validation message with a database override, with **zero refactor of existing views** — normal flat-text `__('Some string')` calls and `validation.*` keys keep working exactly as before; the loader just lets the database win when a translation exists, falling back to the file/hardcoded string otherwise. No duplication: you only ever add the rows you actually want translated.

Rows live in `App\Models\LanguageLine` (extends the package's model), with one addition — a `scope` column purely for the backoffice UI and permissions, with **no effect on actual translation resolution** (that's still driven by Laravel's own `group`/`key`):

| Scope | Route | Permission | Notes |
|---|---|---|---|
| Landing | `/translations` (default) | `translations.landing` | Assignable to Admin |
| Portal | `/translations/portal` | `translations.portal` | Assignable to Admin — app/account/backoffice-only copy |
| Common | `/translations/common` | `translations.common` | **Super-Admin-only** — words reused across every scope, so editing them affects landing and portal wording at once |

Each scope is a real route (not a client-side tab), 404s on an unknown scope, 403s if you lack that scope's permission, and defaults to your first permitted scope if you land on `/translations` without one. Each scope tab shows its own row count as a badge. The page has key/value search (`wire:model.live.debounce.300ms`, same pattern as the Users page) — it's a substring match against the raw JSON `text` column, not a precise per-locale lookup.

Adding a line by hand: pick **Text** (Laravel's flat `__()` group, `*`) or **Validation** (overrides a validator message like `required` or `custom.email.required`), type the key exactly as it appears in code, fill in a value for whichever language is currently selected (see below).

The **Translations** nav item itself only appears once 2+ languages are active — same rule as the switcher (`LanguageService::isMultiLanguageEnabled()`), since there's nothing to translate *to* with just one.

### Editing: one language at a time

Rather than one input per active language crammed into each row, the page has a single **language switcher** (a row of buttons reading "Editing language: English · العربية · …") that drives every line at once — pick a language, every line's textarea shows (and saves) only that language's value. This scales to any number of active languages without the row layout getting wider, and it means a translator who only reads Arabic never has to see (or risk touching) any other language's field.

- The textarea is `flux:textarea rows="auto" resize="none"` — grows with content via the CSS `field-sizing: content` property, no JS needed (falls back to a normal fixed-height scrollable textarea on browsers that don't support it yet).
- The key itself doubles as the English reference text (see [placeholder protection](#placeholder-protection) below for why English is never actually blank), so there's no separate "English" box to keep in sync unless English happens to be one of the active languages, in which case it appears as an ordinary tab in the switcher.

### Placeholder protection

Every `:token`-shaped substring in a line's key (`App\Models\LanguageLine::extractPlaceholders()`) is shown as an amber badge next to the key, and enforced server-side on save: `TranslationsPage::save()`/`addLine()` diff the required tokens against whatever the translator typed for the currently-selected language, and reject the save with an inline error if any are missing. This exists because a translator working purely in the text box has no way to know `:name` is a code token rather than literal words to translate away — rather than trying to lock the character range client-side (fragile, and this Flux tier has no rich-text/masked-input primitive to do it cleanly), the badge tells them what must survive and the save-time check catches it if it doesn't.

### English is always seeded

Regardless of which language is marked **primary** (see [Languages](#languages-backoffice-languages) above), English is treated as the one language that's never left blank:

- `TranslationScannerService::sync()` seeds `text.en` with the literal key on every string it creates.
- `addLine()` does the same for the **Text** group if you don't supply an English value yourself.

This matters because the key literally *is* the English string — leaving it unseeded looks like "English translation missing" in the **Missing translations** card for something that was never actually missing.

### Analytics cards & auto-sync

Four cards sit above the scope tabs, computed page-wide (not scoped to the current tab):

| Card | Meaning |
|---|---|
| **Total strings** | `LanguageLine::count()` — every row across every scope |
| **Missing translations** | Rows missing a value for at least one *active* language |
| **Active languages** | `LanguageService::activeCodes()` count |
| **Pending sync** | `__('...')` calls found in the codebase with no matching row yet — "Sync now" button, or "Up to date" once it's 0 |

`App\Services\TranslationScannerService` does the scanning: it walks every file under `app/` and `resources/views/` whose extension is `php` — `SplFileInfo::getExtension()` returns everything after the *last* dot, so this matches both `.php` and `.blade.php` in one filter — regex-matching literal `__('...')`/`__("...")` calls. Dynamic keys (`__($variable)`) can't be scanned and are skipped, same as any static-analysis based scanner. Each found string is deduped and tagged with a scope by **directory**, first match wins:

- `resources/views/pages/{landing,auth}/**`, `layouts/{landing,auth}.blade.php` → **landing**
- `resources/views/pages/{app,account,backoffice}/**`, `layouts/{app,accounts,backoffice}.blade.php` → **portal**
- Everything else (`app/`, shared `resources/views/components`, `resources/views/livewire`, etc.) → **common**

Clicking **Sync now** creates a `LanguageLine` (group `*`, `text.en` seeded — see [below](#english-is-always-seeded)) for every pending string whose scope you're allowed to edit — an Admin without the `translations.common` permission will sync their landing/portal strings but leave any pending `common` ones for a Super Admin. Nothing is ever overwritten or deleted by a sync; it only fills in rows that don't exist yet, so admins are still free to translate them afterward from the normal per-line editor.

### Machine translation (Google Translate, optional)

A **"Translate with Google"** button sits next to the language switcher — only shown when both are true:

- A Google Translate API key is configured (Backoffice → Settings → "Google Translate API key" — a `secret`-type field, see [Currency & Money](/guide/currency) for how the Settings page's field types work; the key is encrypted at rest via `Crypt::encryptString()` and never round-tripped back into the page).
- The currently-selected language isn't English — there's nothing to translate English *to* from itself, so the button simply never appears while editing it.

Clicking it is entirely the admin's choice — nothing runs automatically. `App\Services\GoogleTranslateService::translateMany()` sends every pending (still-blank) string in the current scope to Google's Cloud Translation API v2 in a single batched request, then each result goes through the exact same [placeholder check](#placeholder-protection) a manual save does — a translation that dropped a `:token` is **skipped**, not saved, so a bad machine translation can never silently break a string. Existing (human) translations are never overwritten; this only ever fills in blanks.

Need a key? Backoffice → Settings shows a link straight to the [Google Cloud Console credentials page](https://console.cloud.google.com/apis/credentials) next to the field — enable the Cloud Translation API on your project first, then create an API key.
