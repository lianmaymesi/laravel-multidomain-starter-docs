# Roles & Permissions

Built on `spatie/laravel-permission`, with two permanent system roles, a `slug`/`name` split on every role, and real per-page permission enforcement across the backoffice's Access Control (Roles, Permissions, Users) and Maintenance pages.

## System roles

Every fresh install seeds two roles via `Database\Seeders\RolePermissionSeeder`:

| Role | Slug | Privilege |
|---|---|---|
| Super Admin | `super-admin` | Every ability, always — see [Gate bypass](#gate-bypass) below. |
| Admin | `admin` | Everything except managing the Permission catalog and touching portal roles — see [What Admin can't do](#what-admin-can-t-do). |

Both are created with `locked = true` on the `roles` table. A locked role can **never be edited or deleted by anyone, including Super Admin** — this is enforced as a hard rule in `resources/views/pages/backoffice/roles/⚡roles/roles.php` (`guardMutable()`), not a permission, so it can't be granted away.

```
                    Gate::allows($ability)?
                            │
                 ┌──────────┴──────────┐
          user is Super Admin      anyone else
                 │                      │
          always true             resolved normally via
       (Gate::before bypass,       Spatie's hasPermissionTo()
        AuthServiceProvider)
```

## Gate bypass

`App\Providers\AuthServiceProvider::boot()` registers:

```php
Gate::before(fn (User $user, string $ability) => $user->hasRoleSlug(Role::SUPER_ADMIN) ? true : null);
```

Returning `null` for everyone else falls through to Spatie's own `Gate::before`, which resolves any ability string straight to `hasPermissionTo()` — so no `Gate::define()` calls exist anywhere for the permissions below. Super Admin also holds every `Permission` row directly (synced in the seeder), belt-and-suspenders alongside the bypass, so a report or query that reads permissions directly (rather than going through `Gate`) still sees the full set.

This bypass only covers `Gate::allows()`/`@can` checks — it doesn't touch `App\Http\Middleware\EnsurePortalAccess`, which never calls `Gate`. So Super Admin's access to *every portal* (including role-scoped ones like `blog`, without holding that role) is a separate, explicit bypass at the top of that middleware:

```php
$hasAccess = $user->hasRoleSlug(Role::SUPER_ADMIN) || match ($portal) {
    'staff' => $user->isStaff(),
    'user' => ! $user->isStaff(),
    default => $user->hasRoleSlug($portal),
};
```

## Portal roles: `slug` vs `name`

A portal role (one scaffolded by `make:subdomain`, e.g. for a `blog` subdomain) now has:

- `slug` — the lowercase-hyphen portal key (`blog`), matched by the `portal:{slug}` middleware (`App\Http\Middleware\EnsurePortalAccess`) and `User::redirect()`.
- `name` — a Title Case label for display (`Blog`), generated with `Str::headline($slug)`.

```php
// App\Console\Commands\MakeSubdomainCommand
$role = Role::firstOrCreate(
    ['slug' => $name, 'guard_name' => 'web'],
    ['name' => Str::headline($name)],
);
```

`App\Models\Role::isPortalRole()` checks `array_key_exists($this->slug, config('multidomain.sub_domains'))`. Only **Super Admin** may edit or delete a portal role — Admin gets read + assign-to-user only, since renaming or deleting a portal role would break the subdomain it drives.

## What Admin can't do

- **Create, edit, or delete Permissions.** The Permissions catalog (`backoffice.permissions.index`) is Super-Admin-only; Admin's seeded permission set omits `permissions.create`, `permissions.edit`, and `permissions.delete`.
- **Edit or delete a portal role**, or either system role (see above).
- **Grant a permission it doesn't itself hold.** The permission-assignment page (below) scopes the selectable list to `auth()->user()->getAllPermissions()` for anyone who isn't Super Admin — this is what stops an Admin-created role from being escalated with, say, `permissions.create`, without a separate explicit check.

Everything else — creating roles, editing/deleting roles it created, assigning any (non-Super-Admin) role to a user — Admin can do freely.

## Super Admin visibility

The Super Admin role itself is invisible to everyone except Super Admin users: hidden from the Roles list and from the Users page's role-assignment checkboxes for any other viewer. `Users::save()` also re-filters the submitted role ids server-side against that same allow-list, so a tampered request can't smuggle in the Super Admin role id.

## Permissions

All permissions use a `module.action` dot-case convention, defined once in `RolePermissionSeeder::PERMISSIONS`:

```
maintenance.view          maintenance.update          settings.edit
roles.view                roles.create               roles.edit
roles.delete              roles.assign-permissions
permissions.view          permissions.create          permissions.edit
permissions.delete
users.view                users.assign-roles
languages.view            languages.create            languages.edit
languages.delete          currencies.view
translations.landing      translations.portal          translations.common
```

`languages.*` and `translations.common` are Super-Admin-only, same mechanism as `permissions.*` above (added to `RolePermissionSeeder::ADMIN_EXCLUDED_PERMISSIONS`). `translations.landing`/`translations.portal`, `settings.edit` (the backoffice Settings page — timezone, Google Translate key, and which currencies are active/primary), and `currencies.view` (the read-only Currencies reference page) are ordinary permissions Admin can hold. See [Localization & RTL](/guide/localization) and [Currency & Money](/guide/currency) for what each one gates.

Each backoffice page checks its own module's abilities on mount and on every mutating action (`abort_unless(Gate::allows('roles.edit'), 403)`, etc.), and the sidebar nav (`resources/views/layouts/backoffice.blade.php`) wraps each link in `@can(...)` so a user never sees a link to a page they can't open.

## Assigning permissions to a role

Editing a role's name and managing its permissions are now two separate screens. From the Roles list, "Manage Permissions" opens a dedicated page:

```
Route::livewire('roles/{role}/permissions', 'pages::backoffice.roles.permissions')
    ->name('roles.permissions');
```

Permissions are grouped by their dot-case module prefix (Roles, Permissions, Users, Maintenance) and each one is a switch — toggling it calls `givePermissionTo()`/`revokePermissionTo()` immediately, no Save button. The list of permissions shown is scoped to what the acting user can grant (see [What Admin can't do](#what-admin-can-t-do)), and the page 403s outright for a locked role or, for anyone but Super Admin, a portal role.
