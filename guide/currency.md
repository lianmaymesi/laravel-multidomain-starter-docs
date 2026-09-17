# Currency & Money

Optional — useful if you're building something that needs prices (an e-commerce starter angle), not required for the rest of the app. Everything here stays invisible/no-op until you activate a second currency.

## Money is always an integer

Every amount is stored as an integer in the smallest unit of its currency — cents, paisa, halala — never a float. `App\Support\Money` is an immutable value object pairing that integer with the currency code it belongs to:

```php
$price = new Money(3000, 'USD'); // $30.00
$price->format(); // "$30.00"
```

`App\Casts\MoneyCast` attaches this to any integer column on your own models:

```php
protected function casts(): array
{
    return ['price' => MoneyCast::class.':currency'];
}
```

`currency` here is the name of a sibling column on the same row holding *that record's own* currency code — not a global setting. **This is important**: once a record (e.g. an order) is saved with a currency, it keeps that currency forever. Exchange rate refreshes only ever update the `currencies` table's own rate column — they never rewrite an amount already stored against a specific currency on another model. Omit the cast argument to always fall back to the app's primary currency instead (fine for something that's never meant to hold a historical, immutable price).

## Currencies (Backoffice → Currencies)

`App\Models\Currency` mirrors `Language` closely: `code` (ISO 4217), `name`, `symbol`, `decimal_digits` (2 for most currencies, 0 for JPY/KRW/VND, 3 for BHD/KWD/OMR/JOD), `is_active`, `is_primary`, `order`, plus `exchange_rate`/`rate_synced_at`. `database/seeders/CurrencySeeder.php` seeds ~40 common ISO 4217 currencies — only **USD ships active + primary**, matching how `Language` ships with nothing active until an admin opts in.

`/currencies` is **read-only** — a reference table of every seeded currency, its formatting rule, and its current rate against the primary currency. It has no management actions.

## Managing currencies (Backoffice → Settings)

Which currencies are active and which one is primary is managed from the **Settings** page, not a dedicated CRUD screen — a tag picker: pick a currency from the dropdown and click **Add**, it appears as a tag; click the **×** on a tag to remove it (the primary currency's tag can't be removed that way — pick a different primary first). None of this touches the database until you click the page's one **Save** button, same as every other setting on the page.

- **Refresh rates** is a separate, immediate action (not deferred to Save) — calls `App\Services\ExchangeRateService::refresh()`.
- A daily scheduled job (`routes/console.php`, `App\Jobs\RefreshExchangeRates`, 01:00) keeps rates current automatically.

## Exchange rates — Frankfurter, no API key

`ExchangeRateService` calls [Frankfurter.app](https://frankfurter.dev) (free, ECB-based, no signup) for every active currency's rate relative to the primary currency, storing the result on each `Currency` row. `CurrencyService::convert()` does the minor-units math through the primary currency as the pivot — this is a **display/quoting conversion only**; it's never used to mutate money already stored on another model (see [above](#money-is-always-an-integer)).

Want a paid provider instead (Fixer, OpenExchangeRates) for more accuracy? Swap the implementation in `ExchangeRateService` — the Settings-page "Refresh rates" flow and the scheduled job don't need to change.

## Formatting

`CurrencyService::format(int $minorUnits, ?string $code = null)` — `{symbol}{number_format(...)}` using the currency's own `decimal_digits`, falling back to `"{$code} "` if no symbol is set. No `ext-intl` dependency (this starter doesn't require it) — formatting is done manually rather than via `NumberFormatter`.
