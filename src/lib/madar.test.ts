import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DDG_SEARCH,
  HOUSE_SITES,
  classifyOmnibox,
  duckDuckGoUrl,
  isFavorite,
  looksLikeCalc,
  matchHouseSites,
  matchQuickTools,
  pushVisit,
  toggleFavorite,
  translateUrl,
  wikipediaOpenUrl,
  wikipediaSummaryUrl,
} from "./madar.ts";

describe("classifyOmnibox", () => {
  it("treats http(s) URLs as browse", () => {
    assert.deepEqual(classifyOmnibox("https://alhajda.com/sites"), {
      kind: "url",
      query: "https://alhajda.com/sites",
      href: "https://alhajda.com/sites",
    });
    assert.equal(classifyOmnibox("http://localhost:8080/madar").kind, "url");
  });

  it("treats a bare host as https browse", () => {
    const intent = classifyOmnibox("tools.alhajda.com");
    assert.equal(intent.kind, "url");
    assert.equal(intent.href, "https://tools.alhajda.com/");
  });

  it("allows a host with a path or port", () => {
    assert.equal(classifyOmnibox("alhajda.com/sites").href, "https://alhajda.com/sites");
    assert.equal(classifyOmnibox("127.0.0.1:3000").href, "https://127.0.0.1:3000/");
  });

  it("searches Arabic text and spaces instead of browsing", () => {
    assert.deepEqual(classifyOmnibox("مدار يحيط"), { kind: "search", query: "مدار يحيط" });
    assert.deepEqual(classifyOmnibox("تهجد"), { kind: "search", query: "تهجد" });
  });

  it("does not treat javascript or file schemes as browse", () => {
    assert.equal(classifyOmnibox("javascript:alert(1)").kind, "search");
    assert.equal(classifyOmnibox("file:///etc/passwd").kind, "search");
  });

  it("trims empty input to an empty search", () => {
    assert.deepEqual(classifyOmnibox("   "), { kind: "search", query: "" });
  });
});

describe("duckDuckGoUrl", () => {
  it("encodes Arabic and spaces onto the default engine", () => {
    assert.equal(duckDuckGoUrl("مدار يحيط"), `${DDG_SEARCH}${encodeURIComponent("مدار يحيط")}`);
    assert.ok(duckDuckGoUrl("مدار يحيط").startsWith("https://duckduckgo.com/?q="));
  });
});

describe("matchHouseSites", () => {
  it("returns the full house index when the query is empty", () => {
    assert.equal(matchHouseSites("").length, HOUSE_SITES.length);
    assert.deepEqual(
      matchHouseSites("").map((s) => s.id),
      ["tahajjud", "midad", "sites", "mohsin", "luma", "alhajda-tools", "agent", "hissati"],
    );
  });

  it("matches Arabic names instantly", () => {
    assert.deepEqual(
      matchHouseSites("تهجد").map((s) => s.id),
      ["tahajjud"],
    );
    assert.deepEqual(
      matchHouseSites("مداد").map((s) => s.id),
      ["midad"],
    );
    assert.ok(matchHouseSites("محسن").some((s) => s.id === "mohsin"));
    assert.ok(matchHouseSites("ألعاب").some((s) => s.id === "luma"));
    assert.ok(matchHouseSites("أدوات").some((s) => s.id === "alhajda-tools"));
    assert.ok(matchHouseSites("وكيل").some((s) => s.id === "agent"));
    assert.ok(matchHouseSites("مواقعنا").some((s) => s.id === "sites"));
    assert.ok(matchHouseSites("حصتي").some((s) => s.id === "hissati"));
  });

  it("matches hosts and English aliases", () => {
    assert.ok(matchHouseSites("ai.alhajda").some((s) => s.id === "mohsin"));
    assert.ok(matchHouseSites("luma").some((s) => s.id === "luma"));
    assert.ok(matchHouseSites("mohsen").some((s) => s.id === "mohsin"));
    assert.deepEqual(
      matchHouseSites("https://tahajjud.alhajda.com/").map((s) => s.id),
      ["tahajjud"],
    );
    assert.deepEqual(
      matchHouseSites("https://midad.alhajda.com/library").map((s) => s.id),
      ["midad"],
    );
  });
});

describe("quick tools and knowledge urls", () => {
  it("surfaces the calculator for numeric or Arabic calc queries", () => {
    assert.equal(looksLikeCalc("12 + 5"), true);
    assert.equal(looksLikeCalc("احسب 9×3"), true);
    assert.equal(looksLikeCalc("مدار"), false);
    assert.ok(matchQuickTools("حاسبة").some((t) => t.id === "calc"));
    assert.ok(matchQuickTools("ترجمة").some((t) => t.id === "translate"));
  });

  it("builds Wikipedia and translate links without embedding", () => {
    assert.ok(wikipediaSummaryUrl("مدار", "ar").includes("/ar.wikipedia.org/"));
    assert.ok(wikipediaOpenUrl("orbit", "en").includes("Special:Search"));
    assert.ok(translateUrl("oasis", "ar").startsWith(DDG_SEARCH));
  });
});

describe("history and favorites", () => {
  it("dedupes visits and keeps a short list", () => {
    const first = { title: "تهجد", query: "تهجد", href: "https://tahajjud.alhajda.com/", kind: "house" as const, at: 1 };
    const again = { ...first, at: 2 };
    const next = pushVisit(pushVisit([], first), again);
    assert.equal(next.length, 1);
    assert.equal(next[0]?.at, 2);
  });

  it("toggles a short favorite list", () => {
    const item = { title: "مداد", query: "مداد", href: "https://midad.alhajda.com/", kind: "house" as const, at: 1 };
    const on = toggleFavorite([], item);
    assert.equal(isFavorite(on, item), true);
    assert.equal(isFavorite(toggleFavorite(on, item), item), false);
  });
});

describe("madar portal lock", () => {
  const src = readFileSync(new URL("../apps/madar/portal.tsx", import.meta.url), "utf8");

  it("gives the omnibox stable id/name for باني without cloning a browser chrome", () => {
    assert.match(src, /id="madar-omnibox"/);
    assert.match(src, /name="madar-q"/);
    assert.match(src, /htmlFor="madar-omnibox"/);
    assert.match(src, /aria-label=\{t\(lang, "madarOmnibox"\)\}/);
    assert.equal(src.includes("suppressHydrationWarning"), false);
  });

  it("keeps first paint stable — local history/favorites wait until after mount", () => {
    assert.match(src, /useHydrated/);
    assert.match(src, /historyReady/);
    assert.match(src, /favoritesReady/);
    assert.match(src, /persistReady/);
    assert.match(src, /shownHistory/);
    assert.match(src, /shownFavorites/);
    assert.match(src, /usePersistent<MadarVisit\[]>\("waha:madar:history"/);
    assert.match(src, /usePersistent<MadarVisit\[]>\("waha:madar:favorites"/);
  });
});
