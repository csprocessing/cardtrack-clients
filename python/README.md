# cardtrack

Pokémon card prices for your app, shop or bot: English and Japanese cards, raw and graded, from [CardTrack](https://cardtrack.com).

Raw prices come from CardTrack's own completed sales where we hold them, and TCGplayer's market price where we don't. Each value says which.

```bash
pip install cardtrack
```

Get a free key (1,000 requests a month) at [cardtrack.com/developers](https://cardtrack.com/developers). No dependencies; Python 3.9+.

```python
import os
from cardtrack import CardTrack

ct = CardTrack(os.environ["CARDTRACK_API_KEY"])

res = ct.search(q="charizard", limit=5)
for c in res["cards"]:
    print(c["name"], c["set"], c["value"]["ungraded"], c["value"].get("source"))

card = ct.card("base1-4")["card"]  # English or Japanese id, e.g. "m5_ja-114"
print(card["value"].get("psa10"), card.get("graded"))
```

## Methods

| Method | Calls | Notes |
| --- | --- | --- |
| `search(q=None, limit=None, sort=None)` | `GET /api/v1/cards` | English cards. `limit` 1–100 (default 25), `sort` `value` / `psa10` / `name`. No pagination: `total` says how many matched. |
| `card(card_id)` | `GET /api/v1/cards/{id}` | English or Japanese. |

Every response carries `remaining`, the requests left on your account this month.

## Errors

Failed calls raise `CardTrackError` with `.status` and the API's `.code`:

| Status | Code |
| --- | --- |
| 401 | `missing_api_key`, `invalid_api_key` |
| 404 | `card_not_found` |
| 429 | `monthly_quota_exceeded` (resets on the 1st, 00:00 UTC) |
| 503 | `api_not_enabled` (retry with backoff) |

## Attribution

On the Free, Developer and Pro plans, show the `attribution["text"]` ("Prices by CardTrack") near our prices, linked to `attribution["url"]`. The link may be `rel="nofollow"`.

## Links

- Docs, plans and keys: https://cardtrack.com/developers
- OpenAPI spec: https://cardtrack.com/api/v1/openapi.json
- Terms: https://cardtrack.com/terms

MIT licensed.
