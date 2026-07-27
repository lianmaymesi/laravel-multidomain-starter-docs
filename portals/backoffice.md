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

Backed by `spatie/laravel-permission`. Three Livewire pages:

- **Roles** (`/roles`) — create/edit/delete roles, each with a permission checklist. Shows user-count and permission-count per role.
- **Permissions** (`/permissions`) — simple name-only CRUD.
- **Users** (`/users`) — searchable, paginated user list; assign roles per user via a checklist.

### Protected roles

Any role whose name matches a portal/subdomain key (`app`, `backoffice`, `account`, `auth`, `landing`, `api`, or any custom portal added via [`make:subdomain`](/guide/make-subdomain-command)) **can't be deleted** from this screen. `User::redirect()` reads a user's role names against `config('multidomain.sub_domains')` to decide which portal sends them home after login — deleting one of these roles would silently break that routing for anyone holding it.

Seed a baseline with `database/seeders/AdminUserSeeder.php`, which creates a `Super Admin` role with every permission attached.
