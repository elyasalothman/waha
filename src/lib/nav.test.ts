import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CATALOG_TAB_PATHS,
  chromeNav,
  mobileChromeNav,
  moreOverflowNav,
  PERSONAL_NAV,
  TOOLS_OVERFLOW_NAV,
  WORK_NAV,
} from "./nav.ts";

describe("chrome nav lock", () => {
  it("keeps the first-row bar to الميدان + مدار + المزيد", () => {
    assert.deepEqual(
      chromeNav("personal").map((item) => item.to),
      ["/", "/madar", "/more"],
    );
    assert.deepEqual(
      chromeNav("work").map((item) => item.to),
      ["/", "/madar", "/more"],
    );
    assert.deepEqual(
      mobileChromeNav("personal").map((item) => item.to),
      ["/", "/more"],
    );
  });

  it("drops حياتك / مالك / أدواتك / الترفيه / الاستوديو from the Square bar", () => {
    for (const audience of ["personal", "work"] as const) {
      const paths = chromeNav(audience).map((item) => item.to);
      for (const tab of CATALOG_TAB_PATHS) {
        assert.equal(paths.includes(tab), false, `${audience} ${tab}`);
      }
    }
    assert.equal(
      PERSONAL_NAV.some((item) => (CATALOG_TAB_PATHS as readonly string[]).includes(item.to)),
      false,
    );
    assert.equal(
      WORK_NAV.some((item) => (CATALOG_TAB_PATHS as readonly string[]).includes(item.to)),
      false,
    );
  });

  it("keeps Play off the first-row and nests it under المزيد", () => {
    assert.equal(chromeNav("personal").some((item) => item.to === "/games"), false);
    assert.deepEqual(
      TOOLS_OVERFLOW_NAV.map((item) => item.to),
      ["/games"],
    );
    assert.equal(
      moreOverflowNav("personal").some((item) => item.to === "/games"),
      true,
    );
  });

  it("moves catalog wells to المزيد without deleting them", () => {
    assert.deepEqual(
      moreOverflowNav("personal").map((item) => item.to),
      ["/life", "/money", "/tools", "/games", "/studio"],
    );
    assert.deepEqual(
      moreOverflowNav("work").map((item) => item.to),
      ["/workspace", "/money", "/tools", "/studio"],
    );
  });

  it("hides /money from المزيد when the child slice is on", () => {
    assert.equal(
      moreOverflowNav("personal", "child").some((item) => item.to === "/money"),
      false,
    );
    assert.equal(
      moreOverflowNav("personal", "all").some((item) => item.to === "/money"),
      true,
    );
    assert.equal(
      chromeNav("personal", "child").some((item) => item.to === "/money"),
      false,
    );
  });
});
