# Theming

All visual theming is Tailwind v4 CSS, shared across every portal via two files that each portal's CSS entry imports identically:

```
resources/css/theme.css              — brand colors
resources/css/partials/edge-design.css — the "edge design" (zero-radius) system
```

Every portal (`app.css`, `account.css`, `auth.css`, `backoffice.css`, `landing.css`, and any portal scaffolded via [`make:subdomain`](/guide/make-subdomain-command)) imports both, so a change here is instant and consistent app-wide — no per-portal theme drift.

## Brand colors

`theme.css` uses Tailwind's `@theme` block to:

- Remap Flux's `zinc` gray scale onto `slate` (Flux components use `zinc` internally; this reassigns which actual color that resolves to).
- Define a custom brand blue ramp (`--color-blue-50` … `--color-blue-950`) and brand red ramp, used both as regular Tailwind utilities (`bg-blue-500`, `text-red-400`, etc.) and as Flux's accent color (`--color-accent`).
- Set the font to "Instrument Sans".

To rebrand, replace the hex values in the blue/red ramps — every button, badge, and accent color across all portals follows automatically. There's a `.dark` override block for the accent color in dark mode.

## Edge design (zero border-radius)

`edge-design.css` forces every corner in the app to be square — no rounded buttons, cards, inputs, badges, avatars, or checkboxes anywhere, in any portal.

This exists because Flux components don't all use plain `rounded-*` classes internally — some (like `flux:avatar`) set their radius through a CSS custom property instead, which a naive `.rounded-lg { border-radius: 0 }` override won't catch. So the file overrides radius two ways:

1. **By Flux's own `data-flux-*` attributes** (`[data-flux-card]`, `[data-flux-button]`, `[data-flux-avatar]`, etc.) — catches components that don't use a matching utility class name.
2. **By literal Tailwind `rounded-*` class name** (`.rounded-lg`, `.rounded-2xl`, `.rounded-full`, …) — catches custom markup in the app's own Blade views.

If you add a new Flux component type to the app and it still shows rounded corners, check what CSS variable or class it uses internally (`vendor/livewire/flux/stubs/resources/views/flux/{component}/`) and add a matching override here.

Also in this file: hard-offset (non-blurred) drop shadows on primary/danger buttons that shift on hover/active, a brand-tinted avatar background (instead of Flux's default gray), uppercase/letterspaced field labels, and a hidden-but-functional scrollbar.

### Turning edge design off

Delete the `@import "./partials/edge-design.css";` line from any portal's CSS file (or all of them) to fall back to Flux's normal rounded-corner defaults for that portal.
