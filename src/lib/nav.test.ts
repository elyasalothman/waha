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

describe("simple Waha navigation", () => {
  it("keeps the same five core destinations on mobile and desktop for both audiences", () => {
    const expected = ["/", "/books", "/tools", "/games", "/me"];
    for (const audience of ["personal", "work"] as const) {
      assert.deepEqual(
        chromeNav(audience).map((item) => item.to),
        expected,
      );
      assert.deepEqual(
        mobileChromeNav(audience).map((item) => item.to),
        expected,
      );
    }
    assert.deepEqual(PERSONAL_NAV, WORK_NAV);
  });

  it("keeps legacy catalog sections reachable without adding tabs", () => {
    assert.deepEqual(
      moreOverflowNav("personal").map((item) => item.to),
      ["/life", "/money", "/tools", "/games", "/studio"],
    );
    assert.deepEqual(
      moreOverflowNav("work").map((item) => item.to),
      ["/workspace", "/money", "/tools", "/studio"],
    );
    assert.deepEqual(
      TOOLS_OVERFLOW_NAV.map((item) => item.to),
      ["/games"],
    );
    assert.ok((CATALOG_TAB_PATHS as readonly string[]).includes("/life"));
  });

  it("keeps money out of child navigation", () => {
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
