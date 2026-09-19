import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SEED_POSTS } from "../square/seed.ts";
import { SQUARE_STORAGE_KEY } from "../square/logic.ts";
import {
  DAY_LANE,
  DAY_ROUTE,
  DAY_SECTIONS,
  dayCardIndex,
  dayHasBooksWebView,
  dayHasSlides,
  dayPegKeepsHomeIntact,
  todayMaydanCard,
} from "./logic.ts";

describe("day peg lock — يومك في واحة", () => {
  it("picks one stable Maydan seed card for the civil day", () => {
    const a = todayMaydanCard(new Date(2026, 8, 19, 8, 0, 0));
    const b = todayMaydanCard(new Date(2026, 8, 19, 22, 40, 0));
    const next = todayMaydanCard(new Date(2026, 8, 20, 8, 0, 0));
    assert.equal(a.id, b.id);
    assert.notEqual(a.id, next.id);
    assert.equal(SEED_POSTS.includes(a), true);
    assert.equal(dayCardIndex(new Date(2026, 8, 19, 0, 0, 0), SEED_POSTS.length), dayCardIndex(new Date(2026, 8, 19, 23, 0, 0), SEED_POSTS.length));
  });

  it("locks the council: /day gathers ask + shadow + today’s card", () => {
    assert.equal(DAY_ROUTE, "/day");
    assert.equal(DAY_LANE, "yawmak-v1");
    assert.deepEqual([...DAY_SECTIONS], ["shadow", "card", "ask"]);
    assert.equal(dayPegKeepsHomeIntact(), true);
    assert.equal(dayHasSlides(), false);
    assert.equal(dayHasBooksWebView(), false);
    assert.notEqual(SQUARE_STORAGE_KEY, "waha:day");
  });

  it("keeps `/` as Maydan + thin shadow — no day page, slides, or books WebView", () => {
    const home = readFileSync(new URL("../../routes/index.tsx", import.meta.url), "utf8");
    const square = readFileSync(new URL("../../components/square/square-page.tsx", import.meta.url), "utf8");
    const shadow = readFileSync(new URL("../../components/square/day-shadow.tsx", import.meta.url), "utf8");
    assert.match(home, /SquarePage/);
    assert.doesNotMatch(home, /DayPage|DailySlides|BooksPage|WebView|<iframe/);
    assert.doesNotMatch(square, /DayPage|DailySlides|BooksPage|lib\/books|WebView|<iframe/);
    assert.match(square, /data-home-sections="day-shadow house-doors square"/);
    assert.match(shadow, /data-shadow="thin"/);
    assert.match(shadow, /to="\/day"/);
  });

  it("builds a quiet /day surface with the three sections and no slides or books", () => {
    const page = readFileSync(new URL("../../apps/day/page.tsx", import.meta.url), "utf8");
    const route = readFileSync(new URL("../../routes/day.tsx", import.meta.url), "utf8");
    const nav = readFileSync(new URL("../nav.ts", import.meta.url), "utf8");
    const slides = readFileSync(new URL("../../components/daily-slides.tsx", import.meta.url), "utf8");
    assert.match(route, /createFileRoute\("\/day"\)/);
    assert.match(page, /data-day-peg="yawmak-v1"/);
    assert.match(page, /data-day-sections="shadow card ask"/);
    assert.match(page, /data-on-maydan="false"/);
    assert.match(page, /data-guest-read="open"/);
    assert.match(page, /data-day-section="shadow"/);
    assert.match(page, /data-day-section="card"/);
    assert.match(page, /data-day-section="ask"/);
    assert.match(page, /ShadowDay/);
    assert.match(page, /todayMaydanCard/);
    assert.match(page, /formatTodayVerse/);
    assert.match(page, /askWaha/);
    assert.match(page, /mode: "chat"/);
    assert.doesNotMatch(page, /DailySlides|lib\/books|waha:books|BooksPage|WebView|<iframe/);
    assert.doesNotMatch(page, /translate|write/);
    assert.match(nav, /to: "\/day"/);
    assert.match(slides, /export function DailySlides/);
  });

  it("pegs يومك on chrome like مدار — hidden from the mobile first row", () => {
    const nav = readFileSync(new URL("../nav.ts", import.meta.url), "utf8");
    const shell = readFileSync(new URL("../../components/layout/shell.tsx", import.meta.url), "utf8");
    const i18n = readFileSync(new URL("../i18n.ts", import.meta.url), "utf8");
    assert.match(nav, /to: "\/day"/);
    assert.match(nav, /MOBILE_HIDDEN = new Set\(\["\/madar", "\/clips", "\/day"\]\)/);
    assert.match(shell, /to="\/day"/);
    assert.match(i18n, /يومك في واحة/);
  });
});
