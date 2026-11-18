import test from "node:test";
import assert from "node:assert/strict";
import {
  DESK_DAILY_CAP,
  deskAllowed,
  excerpt,
  figuresPdf,
  htmlToText,
  pricesToCsv,
  printedPrices,
  publicPageUrl,
} from "./mohsen-desk.ts";

test("the desk accepts a public https page and refuses login or payment", () => {
  assert.equal(publicPageUrl("https://example.com/about")?.hostname, "example.com");
  assert.equal(publicPageUrl("http://example.com"), null);
  assert.equal(publicPageUrl("https://user:pass@example.com"), null);
  assert.equal(publicPageUrl("https://shop.example/checkout"), null);
  assert.equal(publicPageUrl("https://accounts.example/login"), null);
  assert.equal(publicPageUrl("https://127.0.0.1/secret"), null);
});

test("prices are copied only when the page prints them", () => {
  const page = htmlToText("<title>متجر</title><p>السعر 40 ريال. <script>alert(1)</script>لا يوجد غيره.</p>");
  assert.equal(page.title, "متجر");
  assert.equal(page.text.includes("alert"), false);
  assert.deepEqual(printedPrices(page.text).map((price) => price.amount), ["40"]);
  assert.equal(printedPrices("لا يوجد رقم").length, 0);
  assert.match(excerpt("جملة أولى. جملة ثانية. جملة ثالثة. جملة رابعة."), /ثالثة/);
  assert.doesNotMatch(excerpt("جملة أولى. جملة ثانية. جملة ثالثة. جملة رابعة."), /رابعة/);
});

test("files stay honest and the daily cap stops the next task", () => {
  const csv = pricesToCsv([{ url: "https://example.com/a", title: "متجر", prices: [] }]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /لا سعر مطبوع/);
  const pdf = figuresPdf([{ url: "https://example.com/a", title: "متجر", prices: [{ amount: "40", unit: "SAR", context: "" }] }]);
  assert.match(pdf, /^%PDF-1\.4/);
  assert.match(pdf, /40 SAR/);
  assert.equal(deskAllowed(DESK_DAILY_CAP - 1), true);
  assert.equal(deskAllowed(DESK_DAILY_CAP), false);
});
