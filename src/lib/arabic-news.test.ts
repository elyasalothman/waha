import { test } from "node:test";
import assert from "node:assert/strict";
import { NEWS_SOURCES, parseArabicFeed, makeBulletin, newsTopic } from "./arabic-news.ts";
const now = Date.parse("2026-10-15T12:00:00Z");
const item = (
  link: string,
  title = "عنوان عربي &amp; موثوق",
  date = "Thu, 15 Oct 2026 11:00:00 GMT",
) =>
  `<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>${date}</pubDate></item>`;
test("Arabic RSS validates publisher, dates and duplicates without articles", () => {
  const good = item("https://www.bbc.com/arabic/articles/test");
  const xml = `<rss>${good}${good}${item("javascript:alert(1)")}${item("https://evil.example/test")}${item("https://www.bbc.com.evil.example/a")}${item("https://www.bbc.com/a", "قديم", "Thu, 01 Oct 2026 11:00:00 GMT")}${item("https://www.bbc.com/a", "مستقبل", "Thu, 15 Oct 2026 15:00:00 GMT")}</rss>`;
  const out = parseArabicFeed(xml, NEWS_SOURCES[0], now);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "عنوان عربي & موثوق");
  assert.equal(out[0].source, "BBC عربي");
  assert.equal("description" in out[0], false);
});
test("rejects entity declarations, oversized XML and malformed dates", () => {
  assert.deepEqual(
    parseArabicFeed("<!DOCTYPE rss>" + item("https://www.bbc.com/a"), NEWS_SOURCES[0], now),
    [],
  );
  assert.deepEqual(parseArabicFeed(" ".repeat(1000001), NEWS_SOURCES[0], now), []);
  assert.deepEqual(
    parseArabicFeed(item("https://www.bbc.com/a", "x", "bad"), NEWS_SOURCES[0], now),
    [],
  );
});
test("bulletin attributes each headline and removes duplicate titles", () => {
  const items = parseArabicFeed(item("https://www.bbc.com/arabic/a"), NEWS_SOURCES[0], now);
  const bulletin = makeBulletin([...items, ...items], new Date(now).toISOString());
  assert.equal(bulletin.mode, "extractive");
  assert.equal(bulletin.items.length, 1);
  assert.ok(bulletin.text.includes("من BBC عربي:"));
  assert.equal(bulletin.updatedAt, new Date(now).toISOString());
});
test("topic filters use clear keyword classes", () => {
  assert.equal(newsTopic("المنتخب يفوز في مباراة"), "رياضة");
  assert.equal(newsTopic("الذكاء اصطناعي وتقنية"), "تقنية");
  assert.equal(newsTopic("ارتفاع أسعار النفط"), "اقتصاد");
  assert.equal(newsTopic("ولي العهد السعودي"), "السعودية");
});
