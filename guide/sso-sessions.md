# Cross-Subdomain SSO

With portals split across subdomains, users would need to log in separately on each one unless the session cookie is shared. This starter kit shares one session cookie by default.

## The setting

```sh
SESSION_DOMAIN=.yourapp.test
```

Laravel's `config/session.php` already normalizes a wildcard form (`*.yourapp.test`) to the leading-dot form browsers expect:

```php
'domain' => env('SESSION_DOMAIN')
    ? Str::replaceStart('*.', '.', (string) env('SESSION_DOMAIN'))
    : null,
```

No app code changes are needed — just set the env var. With it set, logging in on `auth.yourapp.test` keeps you authenticated when you navigate to `app.yourapp.test`, `account.yourapp.test`, etc.

## Single-domain mode

If [`APP_SINGLE_DOMAIN=true`](/guide/single-vs-multi-domain), leave `SESSION_DOMAIN=null`. A host-only cookie is correct there — there's only one host.

## Verifying it works

1. Log in at `auth.yourapp.test/login`.
2. Navigate directly to `app.yourapp.test`.
3. You should land on the dashboard, not get redirected back to login.
