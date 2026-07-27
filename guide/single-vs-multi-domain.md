# Single vs Multi Domain

By default, this starter kit splits its portals across subdomains: `auth.`, `account.`, `app.`, `backoffice.`, and the main domain for `landing`. Some apps want that separation (different teams, different caching/CDN rules, a cleaner mental model for "which area am I in"). Others don't need it.

## The toggle

```sh
APP_SINGLE_DOMAIN=false   # default: split subdomains
APP_SINGLE_DOMAIN=true    # everything on APP_MAIN_DOMAIN
```

This is read in `config/multidomain.php`:

```php
'sub_domains' => (bool) env('APP_SINGLE_DOMAIN', false)
    ? array_fill_keys(['app', 'backoffice', 'landing', 'account', 'auth', 'api'], env('APP_MAIN_DOMAIN'))
    : [
        'app' => 'app.'.env('APP_MAIN_DOMAIN'),
        // ...
    ],
```

`routes/web.php` never changes — its `Route::domain(config('multidomain.sub_domains.app'))` groups just all resolve to the same host when the toggle is on. Laravel registers each group independently and matches whichever one fits the request.

## Known limitation: route collisions

When every portal shares one host, the route **URIs** across portals must not collide. For example, `landing`'s `/` and `account`'s `/` both being registered on the same domain means only the first-registered one is reachable — the others are silently shadowed.

This is a deliberate simplicity tradeoff: keeping the toggle at the config level (rather than rewriting route registration logic) means zero behavioral surprises when subdomains are split, at the cost of you being responsible for keeping paths distinct if you opt into single-domain mode. If you hit a collision, prefix routes in the colliding portal's route file (e.g. `Route::prefix('app')->group(...)`).

## SESSION_DOMAIN interaction

In single-domain mode, leave `SESSION_DOMAIN=null` — everything is host-only anyway. See [Cross-Subdomain SSO](/guide/sso-sessions) for the multi-domain case.
