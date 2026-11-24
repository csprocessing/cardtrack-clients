/**
 * CardTrack Price API client: Pokémon card prices, English and Japanese, raw and graded.
 * Docs and keys: https://cardtrack.com/developers
 */

export type PriceSource = "cardtrack-sales" | "tcgplayer-market" | "cardtrack-bulk-band" | null;

export interface Value {
  /** Raw (ungraded) value in USD. Null when no price is held; see `reason`. */
  ungraded: number | null;
  /** PSA 10 value in USD, where held. */
  psa10?: number | null;
  low: number | null;
  high: number | null;
  confidence: string | null;
  currency: "USD";
  /** Where the raw figure comes from. */
  source?: PriceSource;
  reason?: "not_own_sales" | "no_price";
  lowHighReason?: "range_not_owned";
  psa10Source?: "cardtrack-sales" | null;
  psa10Reason?: "not_own_sales" | "no_price";
}

export interface GradedValue {
  grade: string;
  value: number | null;
  source?: string | null;
  reason?: string;
}

export interface Card {
  /** Stable id, e.g. `base1-4` (English) or `m5_ja-114` (Japanese). */
  id: string;
  language: "en" | "ja";
  name: string;
  nameJa?: string;
  set: string;
  number: string;
  rarity?: string;
  artist?: string;
  image?: string;
  value: Value;
  graded?: GradedValue[];
  /** The card's page on cardtrack.com. */
  url: string;
}

/** The credit to show with CardTrack prices: required on the Free, Developer and Pro plans. */
export interface Attribution {
  text: string;
  url: string;
}

export interface SearchResult {
  /** Requests left on your account this month. */
  remaining: number;
  count: number;
  total: number;
  cards: Card[];
  attribution: Attribution;
}

export interface CardResult {
  remaining: number;
  card: Card;
  attribution: Attribution;
}

export interface SearchOptions {
  /** Matches card name or set name (English cards only). Omit to list everything by `sort`. */
  q?: string;
  /** 1-100, default 25. There is no pagination: narrow `q` to reach more. */
  limit?: number;
  sort?: "value" | "psa10" | "name";
}

export interface ClientOptions {
  /** Your key from https://cardtrack.com/developers (starts with `ct_live_`). */
  apiKey: string;
  /** Defaults to https://cardtrack.com */
  baseUrl?: string;
  /** Defaults to the global fetch (Node 18+, Deno, Bun, workers). */
  fetch?: typeof fetch;
}

/** An error the API answered with: `code` is its error string, e.g. `monthly_quota_exceeded`. */
export class CardTrackError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(`CardTrack API ${status}: ${code}`);
    this.name = "CardTrackError";
  }
}

export class CardTrack {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ClientOptions) {
    if (!opts?.apiKey) throw new Error("CardTrack: apiKey is required (get one at https://cardtrack.com/developers)");
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? "https://cardtrack.com").replace(/\/+$/, "");
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) throw new Error("CardTrack: no fetch available; pass one in the options");
  }

  /** Search English cards by name or set. */
  search(opts: SearchOptions = {}): Promise<SearchResult> {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.limit != null) p.set("limit", String(opts.limit));
    if (opts.sort) p.set("sort", opts.sort);
    const qs = p.toString();
    return this.get<SearchResult>(`/api/v1/cards${qs ? `?${qs}` : ""}`);
  }

  /** Fetch one card, English or Japanese, by id. */
  card(id: string): Promise<CardResult> {
    return this.get<CardResult>(`/api/v1/cards/${encodeURIComponent(id)}`);
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.fetchImpl(this.baseUrl + path, {
      headers: { authorization: `Bearer ${this.apiKey}`, accept: "application/json" },
    });
    const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (!res.ok) throw new CardTrackError(res.status, body?.error ?? "http_error");
    return body as T;
  }
}

export default CardTrack;
