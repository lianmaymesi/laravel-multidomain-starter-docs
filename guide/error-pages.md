# Error Pages

Every portal renders branded 401/403/404/412/419/429/500/503 pages instead of the stock Laravel/vendor ones. Which design a portal uses is controlled by `config('multidomain.page_style')`.

## The style registry

```php
// config/multidomain.php
'page_style' => [
    'auth' => 'shared',
    'app' => 'shared',
    'backoffice' => 'shared',
    'account' => 'shared',
    'landing' => 'landing',
],
```

Each value is one of:

| Value | Meaning |
|---|---|
| `'shared'` | The one common design — `resources/views/errors/shared/page.blade.php` |
| `'own'` | The portal has its own set — `resources/views/errors/{portal}/page.blade.php` |
| `'<portal>'` | Reuse another portal's set verbatim, e.g. `'landing'` |

A portal missing from this array falls back to `'shared'`.

## How it resolves

Laravel's default exception handler renders per-code views (`resources/views/errors/{code}.blade.php`, falling back to `4xx`/`5xx`), but the framework itself ships default views for the common codes (401, 402, 403, 404, 419, 429, 500, 503) — those would pre-empt anything we put in a matching `4xx`/`5xx` file, since Laravel checks the exact code first. So instead of per-code files, `bootstrap/app.php` registers a render callback that catches every HTTP exception before Laravel's own view lookup ever runs:

```php
// bootstrap/app.php
$exceptions->render(function (HttpExceptionInterface $e, Request $request) {
    if ($request->expectsJson()) {
        return null; // let Laravel's normal JSON error response through
    }

    return response()->view('errors._dispatch', ['code' => $e->getStatusCode()], $e->getStatusCode(), $e->getHeaders());
});
```

One file, `resources/views/errors/_dispatch.blade.php`, handles every code dynamically:

1. Resolves the current portal via `App\Support\PortalResolver` (Host header in multi-domain mode, first URI segment in single-domain mode — see [Single vs Multi Domain](/guide/single-vs-multi-domain)).
2. Looks up that portal's style in `page_style`.
3. Renders the matching view, falling back to `errors.shared.page` if the resolved view doesn't exist — so a stub that hasn't been customized never 500s.

`App\Http\Middleware\CheckMaintenance` calls the same dispatcher directly for the [maintenance page](/guide/maintenance-mode), treating `"maintenance"` as a pseudo status code. JSON/API requests are left alone — they still get Laravel's normal JSON error body, not this HTML page.

## Customizing

- **Shared design** (auth/app/backoffice/account): edit `resources/views/errors/shared/page.blade.php`. One file, used everywhere that's set to `'shared'`.
- **Landing**: edit `resources/views/errors/landing/page.blade.php` directly — it's landing's own copy, independent of the shared set, safe to redesign freely.
- **A stub portal with `'own'` style**: edit `resources/views/errors/{name}/page.blade.php`, scaffolded blank by `make:subdomain` — see [make:subdomain § error & maintenance style](/guide/make-subdomain-command#error-maintenance-page-style).

Both default templates pull their copy (title/description per code) from `App\Support\ErrorPageMeta::for($code)` — edit that if you want different wording without touching the templates.

## Assets

The shared design ships its own Vite entry (`resources/css/errors.css`, `resources/js/errors.js`), importing the same `theme.css` + `edge-design.css` every portal does — see [Theming](/guide/theming). No `vite.config.js` edit needed; `portalEntries()` picks it up automatically.
