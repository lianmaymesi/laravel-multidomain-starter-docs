# make:subdomain Command

Scaffolds a new subdomain portal: its CSS/JS entries, Blade layout, a starter Livewire dashboard page, a route file, and an access-control role.

```bash
php artisan make:subdomain blog
```

The name must be lowercase alphanumeric with hyphens (e.g. `blog`, `partner-portal`), can't already exist in `config('multidomain.sub_domains')`, and can't be run while `APP_SINGLE_DOMAIN=true` (a fresh `/` route would collide with the existing portals).

## Prompts

- **Who should be able to access this portal?** — `open` (no login required) or `auth`.
- **Access level** (only if `auth`) — the portal's own role (recommended: a `blog` role, gated by `portal:blog`), `user` (same gate as `app`), or `staff` (same gate as `backoffice`).
- **Should visitors be able to sign up for this portal themselves, from the public register page?** — if yes, asks for a label (e.g. "Blog Writer") to show on the sign-up form.
- **Error & maintenance page style for this portal?** — `shared` (reuse the common auth/app/backoffice/account design, the default), `landing` (reuse landing's), or `own` (scaffold a fresh, blank page to customize). See [Error Pages](/guide/error-pages).

The access answers decide the middleware written into the generated route file. The self-registration answer decides whether a manual step (below) is printed for `registerable_portals`. The page-style answer decides whether an error page file is scaffolded, and whether a manual step is printed for `page_style` (skipped when you pick `shared`, since that's already the default for anything not listed).

## What it creates

```
resources/css/blog.css
resources/js/blog.js
resources/views/layouts/blog.blade.php
resources/views/pages/blog/⚡dashboard/dashboard.php
resources/views/pages/blog/⚡dashboard/dashboard.blade.php
routes/blog.php
```

Plus, only if you picked `own` for the error/maintenance page style:

```
resources/views/errors/blog/page.blade.php
```

Plus a `blog` role (via `spatie/laravel-permission`), created immediately so it's ready to assign — protected from deletion in the backoffice roles screen, since `User::redirect()` uses role names to decide which portal to send a user to after login (see [Backoffice](/portals/backoffice)).

## What it doesn't do

It won't rewrite `config/multidomain.php` or `routes/web.php` for you. Editing PHP source programmatically is fragile — a formatting quirk or unusual structure in your own edits could break the rewrite silently. Instead, the command prints the exact lines to add:

```
1. Add 'blog' => 'blog.'.env('APP_MAIN_DOMAIN') to config/multidomain.php sub_domains array
2. Add this block to routes/web.php:
   Route::domain(config('multidomain.sub_domains.blog'))->name('blog.')->group(fn () => include __DIR__.'/blog.php');
3. Add blog.<APP_MAIN_DOMAIN> to your local hosts/Herd config
4. Assign the "blog" role to any user who should access this portal and be redirected here after login.
5. (only if self-registration was enabled) Add 'blog' => 'Blog Writer' to config/multidomain.php registerable_portals array
6. (only if page style isn't "shared") Add 'blog' => '<style>' to config/multidomain.php page_style array
```

`vite.config.js` needs no edit — it picks up new `resources/css/*` and `resources/js/*` entries automatically.

### Self-registration

The dashboard stub always ships with a guarded Register CTA and the register page always ships with a guarded "Select the user type" dropdown — both keyed off `config('multidomain.registerable_portals')`. Nothing shows up until that config array is populated (step 5), so scaffolding a portal without self-registration is a no-op for both. Once populated, registering with that user type assigns the matching role, which `User::redirect()` then uses to route the new user straight to their portal (see [Backoffice](/portals/backoffice) for how role names double as portal keys).

Small, safe manual edits — versus a code generator quietly mangling files you'll want to hand-tune anyway.

## Stubs

Templates live in `stubs/subdomain/` at the project root:

| Stub                                      | Produces                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `css.stub`                                | `resources/css/{name}.css` — imports the shared `resources/css/theme.css` |
| `js.stub`                                 | `resources/js/{name}.js` — empty, matching the existing convention        |
| `layout.stub`                             | `resources/views/layouts/{name}.blade.php`                                |
| `route.stub`                              | `routes/{name}.php`                                                       |
| `dashboard.stub` / `dashboard.blade.stub` | the starter Livewire dashboard page                                       |
| `error-page.stub`                         | `resources/views/errors/{name}/page.blade.php` — only when `own` style is picked |

Edit these stubs to change what every newly scaffolded portal looks like.
