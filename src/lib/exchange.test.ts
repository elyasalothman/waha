import test from "node:test";
import assert from "node:assert/strict";
test("exchange feed validates base and freshness, deduplicates simultaneous requests and never fabricates fallback prices", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  const fixture = {
    result: "success",
    base_code: "SAR",
    rates: { SAR: 1, USD: 1 / 3.75, EUR: 0.24 },
    time_last_update_unix: Math.floor(Date.now() / 1000),
  };
  try {
    globalThis.fetch = async () => {
      calls++;
      return Response.json(fixture);
    };
    const { exchangeRates } = await import(
      new URL("../../server/lib/exchange.ts?valid", import.meta.url).href
    );
    const [first, second] = await Promise.all([exchangeRates(), exchangeRates()]);
    assert.equal(calls, 1);
    assert.equal(first, second);
    assert.equal(first.rates.USD, 1 / 3.75);
    globalThis.fetch = async () => Response.json({ ...fixture, base_code: "USD" });
    const wrong = await import(new URL("../../server/lib/exchange.ts?wrong", import.meta.url).href);
    await assert.rejects(wrong.exchangeRates());
    globalThis.fetch = async () =>
      Response.json({
        ...fixture,
        time_last_update_unix: Math.floor(Date.now() / 1000) - 4 * 86400,
      });
    const stale = await import(new URL("../../server/lib/exchange.ts?stale", import.meta.url).href);
    await assert.rejects(stale.exchangeRates());
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    const failed = await import(
      new URL("../../server/lib/exchange.ts?failed", import.meta.url).href
    );
    await assert.rejects(failed.exchangeRates());
  } finally {
    globalThis.fetch = original;
  }
});
