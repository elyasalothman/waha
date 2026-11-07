import test from "node:test";
import assert from "node:assert/strict";
import { nextAnalystList, parseAnalystFeed, readAnalystPayload } from "./analysts-feed.ts";

const bilello = {
  id: 6,
  url: "https://x.com/charliebilello/status/2114879002053693669",
  posted_at: "2026-10-27T00:37:01.298Z",
  published_at: "2026-10-27T08:24:21.908Z",
  title: "بيليلو يقرأ نشرة اكتتاب Anthropic: إيرادات 16.3 مليار دولار في نصف عام",
  summary: "يلخص بيليلو أرقام نشرة الاكتتاب.",
  analyst: {
    handle: "charliebilello",
    name: "تشارلي بيليلو",
    ini: "CB",
    color: "#b45309",
    role: "كبير استراتيجيي السوق في Creative Planning",
  },
};

test("the live Hudoo shape keeps the source date, author, and link", () => {
  const [item] = parseAnalystFeed({ items: [bilello, bilello] });
  assert.equal(item?.id, 6);
  assert.equal(item?.postedAt, "2026-10-27T00:37:01.298Z");
  assert.equal(item?.publishedAt, "2026-10-27T08:24:21.908Z");
  assert.equal(item?.analyst.name, "تشارلي بيليلو");
  assert.equal(item?.url, bilello.url);
  assert.equal(parseAnalystFeed({ items: [bilello, bilello] }).length, 1);
});

test("a newer source post becomes the visible opinion without rewriting the old one", () => {
  const current = parseAnalystFeed({ items: [bilello] });
  const incoming = parseAnalystFeed({
    items: [
      bilello,
      {
        ...bilello,
        id: 7,
        posted_at: "2026-11-07T09:00:00.000Z",
        title: "عنوان أحدث من المصدر",
        url: "https://x.com/charliebilello/status/999",
      },
    ],
  });
  assert.equal(current[0]?.id, 6);
  assert.equal(incoming[0]?.id, 7);
  assert.equal(incoming[0]?.title, "عنوان أحدث من المصدر");
  assert.equal(incoming.find((item) => item.id === 6)?.postedAt, bilello.posted_at);
  assert.deepEqual(
    nextAnalystList(current, null).map((item) => item.id),
    [6],
  );
  assert.deepEqual(
    nextAnalystList(current, incoming).map((item) => item.id),
    [7, 6],
  );
});

test("the Waha response shape still exposes the source post time", () => {
  const parsed = parseAnalystFeed({ items: [bilello] });
  const again = readAnalystPayload({ items: parsed, fetchedAt: "2026-11-07T12:00:00.000Z" });
  assert.equal(again[0]?.postedAt, "2026-10-27T00:37:01.298Z");
  assert.equal(again[0]?.title, bilello.title);
});

test("rows without a real https source are dropped", () => {
  const items = parseAnalystFeed({
    items: [
      { ...bilello, url: "http://x.com/charliebilello/status/1" },
      { ...bilello, id: 8, posted_at: "not-a-date" },
      { ...bilello, id: 9, analyst: { handle: "x" } },
    ],
  });
  assert.deepEqual(items, []);
});
