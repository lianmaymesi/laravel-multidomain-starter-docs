# Landing

The public marketing/entry point, served on `APP_MAIN_DOMAIN` directly (no subdomain).

- Route file: `routes/landing.php`
- Layout: `resources/views/layouts/landing.blade.php`
- Pages: `resources/views/pages/landing/`
- CSS/JS: `resources/css/landing.css`, `resources/js/landing.js`

Unauthenticated by default — no middleware applied to this group in `routes/web.php`.

## What's on the page

Unlike the [App portal's](/portals/app) dashboard, this content is written for the starter kit itself rather than being generic placeholder copy — a hero, and a 4-card feature grid covering domain-based routing, the `make:subdomain` command, Livewire, and Flux UI theming. Sign-in/create-account buttons only show if the `login`/`register` routes exist. Swap this out for your own product's marketing page.
