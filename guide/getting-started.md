# Getting Started

## Requirements

- PHP 8.3+
- Laravel 13
- Node.js (for building assets)
- A local dev domain that supports subdomains, e.g. [Laravel Herd](https://herd.laravel.com) with `*.yourapp.test`

## Install

```bash
laravel new my-app --using=lianmaymesi/laravel-multidomain-starter
```

## Configure your domain

Set `APP_MAIN_DOMAIN` in `.env` to your local dev domain:

```sh
APP_MAIN_DOMAIN=yourapp.test
```

Every portal subdomain is derived from this value (see [Config Reference](/reference/config)):

- `yourapp.test` — landing
- `auth.yourapp.test` — login, register, password reset, verification
- `account.yourapp.test` — profile, security, data export
- `app.yourapp.test` — the main authenticated app
- `backoffice.yourapp.test` — staff-only area

Point all of these at your app in Herd/Valet/your hosts file, then visit `auth.yourapp.test/register` to create an account.

## Next steps

- Don't need separate subdomains? See [Single vs Multi Domain](/guide/single-vs-multi-domain).
- Want users to stay logged in across portals? See [Cross-Subdomain SSO](/guide/sso-sessions).
- Adding your own portal? See the [make:subdomain command](/guide/make-subdomain-command).
- Rebranding colors or the square "edge design" look? See [Theming](/guide/theming).
- Explore what each portal actually does: [Auth](/portals/auth), [Account](/portals/account), [Backoffice](/portals/backoffice).
