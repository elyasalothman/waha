import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { t } from "./i18n.ts";
import {
  chromeNav,
  firstFilledTab,
  MAYDAN_PATH,
  mobileChromeNav,
  PERSONAL_NAV,
  TOOLS_OVERFLOW_NAV,
  WORK_NAV,
} from "./nav.ts";

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

  it("keeps Maydan as the first visible filled tab after quiet home", () => {
    const personal = chromeNav("personal").map((item) => item.to);
    const work = chromeNav("work").map((item) => item.to);
    const mobile = mobileChromeNav("personal").map((item) => item.to);

    assert.deepEqual(personal.slice(0, 2), ["/", MAYDAN_PATH]);
    assert.deepEqual(work.slice(0, 2), ["/", MAYDAN_PATH]);
    assert.equal(mobile[0], "/");
    assert.equal(mobile[1], MAYDAN_PATH);
    assert.equal(firstFilledTab("personal").to, MAYDAN_PATH);
    assert.equal(firstFilledTab("work").key, "square");
    assert.equal(t("ar", "home"), "الرئيسية");
    assert.equal(t("ar", "square"), "الميدان");
    assert.equal(t("en", "home"), "Home");
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
