"""CardTrack Price API client: Pokémon card prices, English and Japanese, raw and graded.

Docs and keys: https://cardtrack.com/developers
"""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable, Optional

__all__ = ["CardTrack", "CardTrackError"]
__version__ = "1.0.0"

Transport = Callable[[str, dict], "tuple[int, bytes]"]


class CardTrackError(Exception):
    """An error the API answered with. `code` is its error string, e.g. ``monthly_quota_exceeded``."""

    def __init__(self, status: int, code: str):
        super().__init__(f"CardTrack API {status}: {code}")
        self.status = status
        self.code = code


def _urllib_transport(url: str, headers: dict, timeout: float = 30.0) -> "tuple[int, bytes]":
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, res.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


class CardTrack:
    """
    >>> ct = CardTrack(api_key="ct_live_...")
    >>> ct.search(q="charizard", limit=5)["cards"]
    >>> ct.card("base1-4")["card"]["value"]
    """

    def __init__(self, api_key: str, base_url: str = "https://cardtrack.com", transport: Optional[Transport] = None):
        if not api_key:
            raise ValueError("CardTrack: api_key is required (get one at https://cardtrack.com/developers)")
        self._key = api_key
        self._base = base_url.rstrip("/")
        self._transport = transport or _urllib_transport

    def search(self, q: Optional[str] = None, limit: Optional[int] = None, sort: Optional[str] = None) -> dict[str, Any]:
        """Search English cards by name or set. ``limit`` 1-100 (default 25); ``sort`` value, psa10 or name."""
        params = {k: v for k, v in (("q", q), ("limit", limit), ("sort", sort)) if v not in (None, "")}
        qs = urllib.parse.urlencode(params)
        return self._get("/api/v1/cards" + (f"?{qs}" if qs else ""))

    def card(self, card_id: str) -> dict[str, Any]:
        """Fetch one card, English or Japanese, by id (e.g. ``base1-4`` or ``m5_ja-114``)."""
        return self._get("/api/v1/cards/" + urllib.parse.quote(card_id, safe=""))

    def _get(self, path: str) -> dict[str, Any]:
        status, raw = self._transport(
            self._base + path,
            {"Authorization": f"Bearer {self._key}", "Accept": "application/json", "User-Agent": f"cardtrack-python/{__version__}"},
        )
        try:
            body = json.loads(raw or b"null")
        except ValueError:
            body = None
        if status >= 400:
            code = body.get("error") if isinstance(body, dict) else None
            raise CardTrackError(status, code or "http_error")
        return body
