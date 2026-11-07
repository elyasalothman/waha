import test from "node:test";
import assert from "node:assert/strict";
import { guideSite, isAllowlistedHref, SITE_GUIDE_NONE } from "./site-guide.ts";

const hrefs = (query: string, hideMoney = false) => {
  const guide = guideSite(query, { hideMoney });
  return guide.mode === "navigate" ? guide.matches.map((item) => item.href) : [];
};

test("library and research questions resolve to real pages", () => {
  const both = hrefs("وديي أقرأ كتاب في واحة، وين المكتبة ومركز الأبحاث؟");
  assert.ok(both.includes("/books"));
  assert.ok(both.includes("https://lab.alhajda.com/research/"));
  assert.deepEqual(hrefs("وين المكتبه"), ["/books"]);
  assert.deepEqual(hrefs("مركز الابحاث"), ["https://lab.alhajda.com/research/"]);
  assert.deepEqual(hrefs("وين مفتاح المصعد؟"), ["/books/library/midad-elevator-key"]);
  assert.deepEqual(hrefs("ابي قصة الدلّة الغائبة"), ["/books/stories/al-dalla"]);
  assert.ok(hrefs("ورقة روبوت الهجدة").includes("https://lab.alhajda.com/research/humanoid/"));
});

test("a general question does not invent a destination", () => {
  assert.equal(guideSite("ما تفسير آية الكرسي؟").mode, "general");
  assert.equal(guideSite("كم ٢٥ × ٤").mode, "general");
});

test("an unknown place is an honest miss", () => {
  const guide = guideSite("وين صاروخ المريخ في الواحة؟");
  assert.equal(guide.mode, "none");
  if (guide.mode === "none") assert.equal(guide.note, SITE_GUIDE_NONE);
});

test("malicious urls are never destinations", () => {
  for (const query of [
    "وين المكتبة javascript:alert(1)",
    "افتح https://evil.example/phish",
    "ودني https://lab.alhajda.com.evil.com/research/",
    "افتح الرابط https://waha.hajdah.com.evil.com",
    "javascript:alert(1)",
    "https://evil.com",
  ]) {
    const guide = guideSite(query);
    const found = guide.mode === "navigate" ? guide.matches : [];
    for (const match of found) {
      assert.equal(isAllowlistedHref(match.href), true, match.href);
      assert.equal(/javascript:|evil\.|data:/i.test(match.href), false, query);
    }
    assert.equal(
      found.some((match) => /javascript:|evil\./i.test(match.href)),
      false,
    );
  }
  assert.equal(isAllowlistedHref("javascript:alert(1)"), false);
  assert.equal(isAllowlistedHref("https://evil.example"), false);
  assert.equal(isAllowlistedHref("//lab.alhajda.com/research/"), false);
  assert.equal(isAllowlistedHref("https://lab.alhajda.com/research/"), true);
  assert.equal(isAllowlistedHref("/books"), true);
});

test("child mode does not offer money pages", () => {
  const open = hrefs("وين السوق السعودي");
  assert.ok(open.some((href) => href.includes("market.alhajda.com")));
  const hidden = guideSite("وين السوق السعودي", { hideMoney: true });
  assert.equal(hidden.mode, "none");
});
