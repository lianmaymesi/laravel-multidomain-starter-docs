# Landing

The public marketing/entry point, served on `APP_MAIN_DOMAIN` directly (no subdomain).

- Route file: `routes/landing.php`
- Layout: `resources/views/layouts/landing.blade.php`
- Pages: `resources/views/pages/landing/`
- CSS/JS: `resources/css/landing.css`, `resources/js/landing.js`

Unauthenticated by default — no middleware applied to this group in `routes/web.php`.

## What's on the page

Unlike the [App portal's](/portals/app) dashboard, this content is written for the starter kit itself rather than being generic placeholder copy — a hero, and a 4-card feature grid covering domain-based routing, the `make:subdomain` command, Livewire, and Flux UI theming. Sign-in/create-account buttons only show if the `login`/`register` routes exist. Swap this out for your own product's marketing page.

## Language switcher

Included in the header via `<x-locale-switcher />` — self-hides until 2+ languages are active. Landing keeps full control of the URL-based locale (`?lang=` or `/xx`, whichever [URL mode](/guide/localization#url-mode) is active), even for a signed-in visitor browsing the marketing site. See [Localization & RTL](/guide/localization).

## Error & maintenance pages

Landing is the one portal that ships its own error/maintenance design out of the box (`resources/views/errors/landing/page.blade.php`) instead of sharing the auth/app/backoffice/account set — edit that file directly to restyle it, independently of the shared one. See [Error Pages](/guide/error-pages).
