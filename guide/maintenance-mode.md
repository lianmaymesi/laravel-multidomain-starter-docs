# Maintenance Mode

Two independent layers, both rendering the same branded maintenance page (see [Error Pages](/guide/error-pages) — it's dispatched the same way, with `"maintenance"` as the pseudo status code):

1. **Global env switch** — `APP_MAINTENANCE`. An absolute kill switch: every portal, **backoffice included**, shows the maintenance page. No CLI access required, just flip the env var and deploy.
2. **Per-portal toggle** — controlled from Backoffice → Maintenance. Staff can take any single portal down (landing, app, account, auth, or any custom stub) without touching the others. **Backoffice can never be put into maintenance this way** — staff always need a way in.

The global switch overrides everything, including the backoffice exemption above — if `APP_MAINTENANCE=true`, backoffice is down too.

```
                    APP_MAINTENANCE=true?
                            │
                 ┌──────────┴──────────┐
                yes                    no
                 │                      │
      EVERY portal down       portal in exempt_portals?
      (backoffice included)    (backoffice, by default)
                                        │
                             ┌──────────┴──────────┐
                            yes                     no
                             │                       │
                    always passes through   per-portal toggle on?
                                                      │
                                           ┌──────────┴──────────┐
                                          yes                    no
                                           │                      │
                                  maintenance page          passes through
```

## Enforcement

`App\Http\Middleware\CheckMaintenance` is appended globally to the `web` middleware group in `bootstrap/app.php` — it covers every current and future portal automatically, no per-route-file edit needed when you scaffold a new one with `make:subdomain`.

```php
// bootstrap/app.php
$middleware->web(append: [
    CheckMaintenance::class,
]);
```

Config lives in `config/maintenance.php`:

```php
'global' => (bool) env('APP_MAINTENANCE', false),
'exempt_portals' => ['backoffice'],
```

## Per-portal toggle (Backoffice → Maintenance)

Backed by the `portal_settings` table (`App\Models\PortalSetting`) — one row per portal, with `maintenance_mode` and an optional custom `message` shown on that portal's maintenance page instead of the generic copy. Reads are cached for 5 minutes (`Cache::remember`, key `portal-setting:{portal}`) and busted on every save, so the toggle takes effect on the next request either way.

The backoffice page (`resources/views/pages/backoffice/⚡maintenance/`) lists every portal in `config('multidomain.sub_domains')` except those in `maintenance.exempt_portals`, with a switch and a message field per row.

## Native Laravel maintenance mode

`php artisan down` / `php artisan up` still work exactly as normal Laravel — this starter kit doesn't touch that mechanism. It's a separate, CLI-only, whole-app switch. For per-portal granularity or an env-driven (no-CLI) toggle, use the system on this page instead.
