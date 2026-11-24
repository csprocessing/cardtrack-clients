import { test } from "node:test";
import assert from "node:assert/strict";
import { CardTrack, CardTrackError } from "../dist/index.js";

const fake = (status, body, seen) => async (url, init) => {
  seen.push({ url, init });
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
};

test("search sends the key and the query", async () => {
  const seen = [];
  const ct = new CardTrack({ apiKey: "ct_live_x", fetch: fake(200, { remaining: 9, count: 0, total: 0, cards: [], attribution: { text: "Prices by CardTrack", url: "https://cardtrack.com" } }, seen) });
  const r = await ct.search({ q: "charizard", limit: 5, sort: "psa10" });
  assert.equal(r.remaining, 9);
  assert.equal(seen[0].url, "https://cardtrack.com/api/v1/cards?q=charizard&limit=5&sort=psa10");
  assert.equal(seen[0].init.headers.authorization, "Bearer ct_live_x");
});

test("card encodes the id", async () => {
  const seen = [];
  const ct = new CardTrack({ apiKey: "ct_live_x", baseUrl: "https://example.test/", fetch: fake(200, { remaining: 1, card: {}, attribution: {} }, seen) });
  await ct.card("m5_ja-114");
  assert.equal(seen[0].url, "https://example.test/api/v1/cards/m5_ja-114");
});

test("errors carry the API's code", async () => {
  const ct = new CardTrack({ apiKey: "ct_live_x", fetch: fake(429, { error: "monthly_quota_exceeded" }, []) });
  await assert.rejects(ct.card("base1-4"), (e) => e instanceof CardTrackError && e.status === 429 && e.code === "monthly_quota_exceeded");
});

test("a key is required", () => {
  assert.throws(() => new CardTrack({ apiKey: "" }), /apiKey is required/);
});
