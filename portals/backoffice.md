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
