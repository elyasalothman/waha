import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chromeNav, mobileChromeNav, PERSONAL_NAV, TOOLS_OVERFLOW_NAV, WORK_NAV } from "./nav.ts";

describe("chrome nav lock", () => {
  it("keeps Play off the first-row personal and work bars", () => {
    const personal = chromeNav("personal").map((item) => item.to);
    const work = chromeNav("work").map((item) => item.to);
    const mobile = mobileChromeNav("personal").map((item) => item.to);

    assert.equal(personal.includes("/games"), false);
    assert.equal(work.includes("/games"), false);
    assert.equal(mobile.includes("/games"), false);
    assert.equal(
      PERSONAL_NAV.some((item) => item.key === "games"),
      false,
    );
    assert.equal(
      WORK_NAV.some((item) => item.key === "games"),
      false,
    );
  });

  it("nests games under Tools overflow only", () => {
    assert.deepEqual(
      TOOLS_OVERFLOW_NAV.map((item) => item.to),
      ["/games"],
    );
    assert.equal(
      chromeNav("personal").some((item) => TOOLS_OVERFLOW_NAV.some((nested) => nested.to === item.to)),
      false,
    );
  });
});
