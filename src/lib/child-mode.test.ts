import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hideMoney,
  homeMoneyWidgets,
  isChildMode,
  isMoneySurface,
  moneyPathBlocked,
  parseChildSegment,
  withoutMoneyNav,
} from "./child-mode.ts";
import { MORE_OVERFLOW_NAV, chromeNav, moreOverflowNav } from "./nav.ts";

describe("child-mode money lock", () => {
  it("treats only segment=child as child mode", () => {
    assert.equal(parseChildSegment("child"), "child");
    assert.equal(parseChildSegment("all"), "all");
    assert.equal(parseChildSegment("family"), "all");
    assert.equal(isChildMode("child"), true);
    assert.equal(isChildMode("work"), false);
    assert.equal(hideMoney("child"), true);
    assert.equal(hideMoney("all"), false);
  });

  it("hides مصروف اليوم and other home spend widgets in child mode", () => {
    const open = homeMoneyWidgets("all");
    assert.equal(open.some((w) => w.title.ar === "مصروف اليوم"), true);
    assert.equal(open.every((w) => w.kind === "spend"), true);
    assert.deepEqual(homeMoneyWidgets("child"), []);
    assert.deepEqual(homeMoneyWidgets("family"), open);
  });

  it("blocks /money for the child slice and leaves it open otherwise", () => {
    assert.equal(moneyPathBlocked("/money", "child"), true);
    assert.equal(moneyPathBlocked("/money/budget", "child"), true);
    assert.equal(moneyPathBlocked("/money", "all"), false);
    assert.equal(moneyPathBlocked("/life", "child"), false);
  });

  it("drops /money from المزيد when the slice is child — PIN untouched", () => {
    assert.equal(moreOverflowNav("personal", "child").some((item) => item.to === "/money"), false);
    assert.equal(moreOverflowNav("work", "child").some((item) => item.to === "/money"), false);
    assert.equal(moreOverflowNav("personal", "all").some((item) => item.to === "/money"), true);
    assert.equal(chromeNav("personal", "child").some((item) => item.to === "/money"), false);
    assert.deepEqual(
      withoutMoneyNav(MORE_OVERFLOW_NAV, "child").map((item) => item.to),
      MORE_OVERFLOW_NAV.filter((item) => item.to !== "/money").map((item) => item.to),
    );
  });

  it("marks money catalog surfaces so home and /app/$id can refuse them", () => {
    assert.equal(isMoneySurface({ category: "money", lane: "money", id: "budget" }), true);
    assert.equal(isMoneySurface({ category: "life", lane: "worship", id: "salah" }), false);
  });
});
