import json
import unittest

from cardtrack import CardTrack, CardTrackError


def fake(status, body, seen):
    def transport(url, headers):
        seen.append((url, headers))
        return status, json.dumps(body).encode()
    return transport


class ClientTest(unittest.TestCase):
    def test_search_sends_key_and_query(self):
        seen = []
        ct = CardTrack("ct_live_x", transport=fake(200, {"remaining": 9, "cards": []}, seen))
        self.assertEqual(ct.search(q="charizard", limit=5, sort="psa10")["remaining"], 9)
        self.assertEqual(seen[0][0], "https://cardtrack.com/api/v1/cards?q=charizard&limit=5&sort=psa10")
        self.assertEqual(seen[0][1]["Authorization"], "Bearer ct_live_x")

    def test_card_quotes_the_id(self):
        seen = []
        CardTrack("ct_live_x", base_url="https://example.test/", transport=fake(200, {}, seen)).card("m5_ja-114")
        self.assertEqual(seen[0][0], "https://example.test/api/v1/cards/m5_ja-114")

    def test_errors_carry_the_code(self):
        ct = CardTrack("ct_live_x", transport=fake(429, {"error": "monthly_quota_exceeded"}, []))
        with self.assertRaises(CardTrackError) as cm:
            ct.card("base1-4")
        self.assertEqual((cm.exception.status, cm.exception.code), (429, "monthly_quota_exceeded"))

    def test_key_required(self):
        with self.assertRaises(ValueError):
            CardTrack("")


if __name__ == "__main__":
    unittest.main()
