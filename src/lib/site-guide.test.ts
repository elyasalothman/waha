import test from "node:test";
import assert from "node:assert/strict";
import { guideSite, isAllowlistedHref, planGuideTurn, SITE_GUIDE_NONE } from "./site-guide.ts";

const hrefs = (query: string, hideMoney = false) => {
  const guide = guideSite(query, { hideMoney });
  return guide.mode === "navigate" ? guide.matches.map((item) => item.href) : [];
};

test("library and research questions resolve to real pages", () => {
  const both = hrefs("وديي أقرأ كتاب في واحة، وين المكتبة ومركز الأبحاث؟");
  assert.ok(both.includes("/books"));
  assert.ok(both.includes("https://lab.alhajda.com/research/"));
  assert.deepEqual(hrefs("وين المكتبه"), ["/books"]);
  assert.deepEqual(hrefs("وين البث المباشر"), ["/live"]);
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

test("explicit place questions stay on the local registry", () => {
  const library = planGuideTurn("وين المكتبة ومركز الأبحاث؟");
  assert.equal(library.action, "local");
  if (library.action !== "local") return;
  assert.match(library.text, /المكتبة/);
  assert.match(library.text, /الأبحاث/);
  assert.equal(library.text.includes("بوسطن"), false);
  assert.equal(/https?:|javascript:|دليل الصفحات/i.test(library.text), false);
  assert.match(library.text, /هذي وجهاتهم/);
  assert.ok(library.guide.mode === "navigate" && library.guide.matches.some((item) => item.href === "/books"));
  assert.ok(
    library.guide.mode === "navigate" &&
      library.guide.matches.some((item) => item.href === "https://lab.alhajda.com/research/"),
  );

  const book = planGuideTurn("وين مفتاح المصعد؟");
  assert.equal(book.action, "local");
  if (book.action === "local" && book.guide.mode === "navigate") {
    assert.deepEqual(
      book.guide.matches.map((item) => item.href),
      ["/books/library/midad-elevator-key"],
    );
  }

  const missing = planGuideTurn("وين صاروخ المريخ في الواحة؟");
  assert.equal(missing.action, "local");
  if (missing.action === "local") assert.equal(missing.text, SITE_GUIDE_NONE);

  assert.equal(planGuideTurn("ما تفسير آية الكرسي؟").action, "remote");

  const hostile = planGuideTurn("وين المكتبة javascript:alert(1)");
  assert.equal(hostile.action, "local");
  if (hostile.action === "local") {
    assert.equal(/javascript:|alert/i.test(hostile.text), false);
    assert.ok(hostile.guide.mode !== "navigate" || hostile.guide.matches.every((item) => item.href === "/books"));
  }
});

test("a place plus a real question keeps the visitor's question for the remote assistant", () => {
  const mixed = planGuideTurn("وين المكتبة؟ وفسّر لي آية الكرسي");
  assert.equal(mixed.action, "mixed");
  if (mixed.action !== "mixed") return;
  assert.match(mixed.localText, /المكتبة/);
  assert.match(mixed.remoteMessage, /فسّر لي آية الكرسي/);
  assert.equal(mixed.remoteMessage.includes("المكتبه"), false);
  assert.equal(mixed.remoteMessage.includes("المكتبة"), false);

  const math = planGuideTurn("وين البث المباشر؟ وكم 7 × 8");
  assert.equal(math.action, "mixed");
  if (math.action === "mixed") assert.equal(math.remoteMessage, "كم 7 × 8");

  const reading = planGuideTurn("وين كتاب الهجدة؟ واشرح لي فكرته");
  assert.equal(reading.action, "mixed");
  if (reading.action === "mixed") {
    assert.match(reading.remoteMessage, /اشرح لي فكرته/);
    assert.match(reading.remoteMessage, /السياق: كتاب الهجدة/);
  }

  assert.equal(planGuideTurn("كم 7 × 8").action, "remote");
  assert.equal(planGuideTurn("وين المكتبة ومركز الأبحاث؟").action, "local");
  assert.equal(planGuideTurn("وين صاروخ المريخ في الواحة؟").action, "local");
});

test("child mode does not offer money pages", () => {
  const open = hrefs("وين السوق السعودي");
  assert.ok(open.some((href) => href.includes("market.alhajda.com")));
  const hidden = guideSite("وين السوق السعودي", { hideMoney: true });
  assert.equal(hidden.mode, "none");
});
