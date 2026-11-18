import test from "node:test";
import assert from "node:assert/strict";
import { shouldRefreshHome } from "./home-refresh.ts";

test("home refresh runs when visible and skips a hidden or offline network read", () => {
  assert.equal(shouldRefreshHome(false, true, false), true);
  assert.equal(shouldRefreshHome(false, false, false), true);
  assert.equal(shouldRefreshHome(true, true, false), false);
  assert.equal(shouldRefreshHome(false, true, true), true);
  assert.equal(shouldRefreshHome(false, false, true), false);
  assert.equal(shouldRefreshHome(true, true, true), false);
});
