import test from "node:test";
import assert from "node:assert/strict";
import { STORE_PRODUCTS, visibleProducts, normalizeLibrary, acquireProduct } from "./catalog.ts";
test("launch catalog contains actual 16 tracks, imported books and house games with internal destinations", () => {
  assert.equal(STORE_PRODUCTS.filter((p) => p.id.startsWith("hissati-")).length, 16);
  assert.ok(STORE_PRODUCTS.some((p) => p.id.startsWith("midad-")));
  assert.ok(STORE_PRODUCTS.some((p) => p.id === "game-baloot"));
  assert.equal(new Set(STORE_PRODUCTS.map((p) => p.id)).size, STORE_PRODUCTS.length);
  for (const p of STORE_PRODUCTS) {
    assert.ok(p.href.startsWith("/") && !p.href.startsWith("//"));
    assert.equal(p.price, 0);
    assert.equal(p.currency, "SAR");
    assert.equal(p.type, "own");
    assert.equal(p.affiliate.enabled, false);
    assert.ok(p.source && p.description && p.sourceUrl.startsWith("https://"));
  }
});
test("acquisition deduplicates, rejects unknown entries and preserves valid library", () => {
  const id = STORE_PRODUCTS[0].id;
  assert.deepEqual(acquireProduct([id, id, "bogus", null], id), [id]);
  assert.deepEqual(acquireProduct([id], "bogus"), [id]);
  assert.deepEqual(normalizeLibrary({}), []);
});
test("child catalog and acquisition exclude money and unsuitable experiences", () => {
  const child = visibleProducts(true);
  for (const id of [
    "hissati-invest",
    "hissati-money",
    "hissati-finance",
    "hissati-entrepreneurship",
    "hayat",
    "game-baloot",
  ]) {
    assert.ok(!child.some((p) => p.id === id));
    assert.deepEqual(acquireProduct([], id, true), []);
  }
  assert.ok(child.some((p) => p.id === "hissati-code"));
});
