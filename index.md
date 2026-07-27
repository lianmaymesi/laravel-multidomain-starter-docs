---
layout: home

hero:
  name: Laravel Multidomain Starter
  text: Multi-subdomain apps, done simply
  tagline: Dedicated auth, account, app, and backoffice portals — with an optional single-domain mode when you don't need the split.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Why multidomain?
      link: /guide/single-vs-multi-domain

features:
  - title: Portal routing out of the box
    details: Route::domain() groups for auth, account, app, backoffice, and landing — each with its own layout, CSS, and JS entry.
  - title: Single-domain mode
    details: Flip APP_SINGLE_DOMAIN=true and every portal collapses onto one host, no route file changes needed.
  - title: Cross-subdomain SSO
    details: One shared session cookie across all portals via SESSION_DOMAIN, so users log in once.
  - title: make:subdomain generator
    details: Scaffold a brand-new portal's assets, layout, and route file with one Artisan command.
---
