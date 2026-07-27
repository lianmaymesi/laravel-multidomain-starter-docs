# Flux UI: Free vs Pro

This starter kit ships on **Flux UI's free tier** (`livewire/flux`) — no license, no paid account, no private Composer repository needed. `composer install` works out of the box for anyone who clones the repo.

## Why free is enough here

Every `<flux:*>` component actually used across every portal — `avatar`, `badge`, `button`, `card`, `checkbox`, `dropdown`, `error`, `field`, `heading`, `icon`, `input`, `label`, `link`, `menu`, `modal`, `otp`, `select`, `table`, `text` — ships in the free package. None of Flux Pro's exclusive components (accordion, autocomplete, calendar, chart, command palette, date-picker, kanban, rich-text editor, slider, tabs, etc.) are used anywhere in this starter kit.

## Upgrading to Flux Pro

If your own build needs a Pro-only component, and you have a Flux Pro license, this is a pure Composer-level change — no Blade templates need to change, since free and Pro components share the same tag names and API:

```bash
composer config repositories.flux-pro composer https://composer.fluxui.dev
composer require livewire/flux-pro
composer config http-basic.composer.fluxui.dev <your-email> <your-license-key>
```

Use your own Flux Pro credentials for the last command — this repo doesn't ship any.

## CSS is unaffected either way

Every portal's CSS entry imports `vendor/livewire/flux/dist/flux.css` (the free package's compiled styles) regardless of whether `flux-pro` is also installed, so [theming](/guide/theming) works identically on both tiers.
