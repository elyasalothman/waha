import test from "node:test";
import assert from "node:assert/strict";
import { healthResponse } from "./health-response.ts";

test("health response is an uncached liveness signal", async () => {
  const response = healthResponse();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { status: "ok" });
});
