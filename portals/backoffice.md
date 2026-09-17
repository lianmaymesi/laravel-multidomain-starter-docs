# Backoffice

The staff-only admin area, served on `backoffice.APP_MAIN_DOMAIN`.

- Route file: `routes/backoffice.php`
- Layout: `resources/views/layouts/backoffice.blade.php`
- Pages: `resources/views/pages/backoffice/`
- CSS/JS: `resources/css/backoffice.css`, `resources/js/backoffice.js`

## Access control

Wrapped in `['auth', 'phone.verified', 'email.grace', 'portal:staff']`. `portal:staff` redirects non-staff users to `app.dashboard`. Whether a user is staff is decided by `User::isStaff()` (currently a `privilege` column) — adapt this to your own role system; `EnsurePortalAccess` just needs `$user->isStaff()` and `$user->redirect()` to exist.

## Dashboard

`/` → `pages::backoffice.dashboard`

Real counts, not a placeholder — total users, staff count, role count, permission count, plus the 5 most recently registered users. No charts here (compare with the [App portal's](/portals/app) demo dashboard, which is the other way around).

## Roles & permissions

Backed by `spatie/laravel-permission`, gated per-page and per-action by real permissions (not just `portal:staff`). Full details, including the two locked system roles and the `slug`/`name` split on portal roles, live on the dedicated [Roles & Permissions](/guide/roles-and-permissions) page. Summary:

- **Roles** (`/roles`) — create/edit/delete roles; permission assignment lives on its own page (`/roles/{role}/permissions`) with grouped, autosaving toggles.
- **Permissions** (`/permissions`) — simple name-only CRUD, Super-Admin-only.
- **Users** (`/users`) — searchable, paginated user list; assign roles per user via a checklist.

Seeded automatically by `database/seeders/RolePermissionSeeder.php`: a locked **Super Admin** role (bypasses every permission check via `Gate::before`) and a locked **Admin** role (everything except managing Permissions and touching portal/system roles). `database/seeders/AdminUserSeeder.php` then creates the initial staff user and assigns it Super Admin.

## Maintenance

**Maintenance** (`/maintenance`) — take any portal down for visitors with a branded maintenance page, independently of the others. Backoffice itself can't be toggled from here — it's always exempt (see [Maintenance Mode](/guide/maintenance-mode)). If `APP_MAINTENANCE` is set in the environment, a banner explains that it currently overrides every toggle on the page, backoffice included.

## Languages, Currencies, Translations & Settings

Full details on [Localization & RTL](/guide/localization) and [Currency & Money](/guide/currency). Summary:

- **Languages** (`/languages`) — add/reorder/activate languages, set direction (ltr/rtl) and which one is primary. Super-Admin-only. The **Translations** nav item and the account portal's language card only appear once a 2nd language is active.
- **Currencies** (`/currencies`) — read-only reference: every seeded currency, its formatting rule (symbol/decimal digits), and its current rate against the primary currency. `currencies.view`, assignable to Admin. No management actions live here — see Settings.
- **Translations** (`/translations`, `/translations/portal`, `/translations/common`) — database overrides for hardcoded strings and validation messages, split into landing/portal/common scopes with independent permissions. Analytics cards up top (total strings, missing translations, active languages, pending sync), a "Sync now" button that scans the codebase for `__('...')` calls and creates the missing rows automatically, and an optional "Translate with Google" button once a Google Translate API key is configured.
- **Settings** (`/settings`) — every app-wide setting in one place, rendered generically from `App\Services\SettingsRegistry` (add a setting there, not by hand-editing this page): URL mode (`languages.edit`, radio cards), default timezone (`settings.edit`, select), Google Translate API key (`settings.edit`, encrypted secret field with a "Configured" badge and a link to get one), and which currencies are active/primary (`settings.edit`, a tag picker — pick from a dropdown and click Add, remove with the tag's ×). One global Save button for everything on the page; secrets are never round-tripped back into the page and never written to the activity log.
