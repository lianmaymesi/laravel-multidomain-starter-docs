# Activity Log

A permanent, undeletable audit trail of every change to the four admin-relevant models — Roles, Permissions, Users, and portal Maintenance settings — rendered as a vertical, chronological icon-timeline (colored icon + connecting line per entry, consecutive identical events collapsed behind "Show N similar activities"), with a discussion thread (comments + like/unlike) on every entry. One engine, two drop-in ways to use it — see [Two components](#two-components) below.

## Engine: `spatie/laravel-activitylog`, not a UI framework

The package (`spatie/laravel-activitylog`, on v4 here since v5 needs PHP 8.4 and this starter floors at 8.3) only does the hard, easy-to-get-wrong part: capturing old→new attribute diffs and the authenticated causer into an `activity_log` table via a `LogsActivity` trait. It ships **no UI, no delete route, and no scheduled pruning** unless you explicitly wire up its `activitylog:clean` command — which this starter kit deliberately never does. Regardless of timeframe, nothing here is ever auto-deleted.

## What's tracked, and how

`Spatie\Activitylog\Traits\LogsActivity` is added to four models, each with an explicit `logOnly([...])` allowlist:

```php
// App\Models\User — note password/2FA fields are NOT listed, so they can
// never end up in activity_log.properties, logged or not.
public function getActivitylogOptions(): LogOptions
{
    return LogOptions::defaults()
        ->logOnly(['name', 'email', 'privilege'])
        ->logOnlyDirty()
        ->dontSubmitEmptyLogs();
}
```

| Model | Logged fields |
|---|---|
| `App\Models\User` | `name`, `email`, `privilege` |
| `App\Models\Role` | `name`, `slug`, `locked` |
| `App\Models\Permission` | `name` |
| `App\Models\PortalSetting` | `maintenance_mode`, `message` |

`App\Models\Permission` is a new model (mirroring the `App\Models\Role` customization from [Roles & Permissions](/guide/roles-and-permissions)) — the stock `Spatie\Permission\Models\Permission` has nowhere to hang the trait, so `config/permission.php`'s `models.permission` now points here too.

This covers plain attribute changes automatically. It does **not** cover many-to-many pivot changes — granting a permission to a role, or syncing roles onto a user — which is exactly what most of the "why did this change" questions are actually about. Those are logged manually at the point of action:

```php
// resources/views/pages/backoffice/roles/⚡permissions/permissions.php
activity()
    ->causedBy(auth()->user())
    ->performedOn($this->role)
    ->withProperties(['permission' => $permission->name])
    ->log($wasGranted ? 'permission revoked' : 'permission granted');
```

Same pattern in the Users page's `save()`, diffing role ids before/after `syncRoles()` — but logged **on both sides**: once `performedOn($user)` (`'roles synced'`, added/removed role names), and once per affected role `performedOn($role)` (`'role assigned'` / `'role unassigned'`, the user's name). This is what makes a Role's own timeline show every user it's been granted to or taken from, not just its own `name`/`slug`/`locked` edits — "a model and its relations," not just the model in isolation.

## Two components

One engine, `App\Livewire\ActivityTimeline` (`app/Livewire/ActivityTimeline.php`, view at `resources/views/livewire/activity-timeline.blade.php`) — Laravel/Livewire's standard component-discovery convention, so it's usable two ways with no extra wiring:

1. **Scoped, inline** — drop it at the bottom of any record's own page: `<livewire:activity-timeline :model="$post" />`. Shows only that record's history (its own attribute changes plus any relation-changes performed on it — same `subject_type`/`subject_id` the record already carries, no extra query needed). Works for any model with the `LogsActivity` trait, including ones this starter kit doesn't ship.
2. **Scoped, in a modal** — `<x-activity-log-button :model="$role" />` (`resources/views/components/activity-log-button.blade.php`), a small icon button that opens a Flux modal wrapping the same component. Already wired onto every row of the Roles and Users list pages — deliberately **not** added to the Permissions list, since permission renames are rare and already visible from the global page.
3. **Global, unscoped** — `<livewire:activity-timeline />` with no `model` prop (this is all Backoffice → Activity Log at `/backoffice/activity`, permission `activity.view`, is). Shows a model-type filter dropdown built from `Activity::query()->distinct()->pluck('subject_type')` — always in sync with whatever's actually been logged, so any model added later shows up automatically with zero config.

Consecutive entries sharing the same `description` (e.g. toggling the same permission on/off/on) collapse into a "Show N similar activities" expandable group rather than repeating the same line three times. Entry icon/color is derived from the `event` column (`created`/`updated`/`deleted`) or, for the manual relation logs, a keyword match on the description.

The collapse toggle and the per-entry comment panel are plain Alpine `x-data`/`x-show`, not `flux:accordion` — per [Flux UI: Free vs Pro](/reference/flux-ui), Accordion is Pro-only and this starter kit deliberately stays on Flux's free tier.

## Comments & reactions — no package

Deliberately hand-rolled rather than pulling in a comments package: two small tables, `activity_comments` and `activity_comment_reactions`, scoped specifically to activity entries (not a generic commentable-on-anything system).

- **Comments** (`App\Models\ActivityComment`) — permission `activity.comment`. No delete column, no delete method, no delete route anywhere — permanent, same as the log itself. The compose box is a plain `flux:textarea` (free-tier) rather than a rich editor.
- **Reactions** (`App\Models\ActivityCommentReaction`) — a boolean `is_like` per `(comment, user)` pair, enforced by a unique constraint. Clicking the same reaction again removes it; clicking the other one switches it. Available to anyone with `activity.view` — no separate permission, since it's a low-stakes acknowledgement, not a content-authoring action.

## Permissions

Two new entries in `RolePermissionSeeder::PERMISSIONS`: `activity.view` and `activity.comment`. Both land in Admin's default set automatically (only `permissions.*` is excluded there — see [Roles & Permissions](/guide/roles-and-permissions)). There is no `activity.delete` — it was never defined, because there's nothing in the UI it could gate.
