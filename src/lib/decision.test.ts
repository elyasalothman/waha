import { test } from "node:test";
import { strict as assert } from "node:assert";
import { weightedScore } from "./decision.ts";
test("comparison uses weighted criteria and handles empty and invalid weights", () => {
  assert.equal(weightedScore([10, 0], [3, 1]), 7.5);
  assert.equal(weightedScore([10, 10], [0, 0]), 0);
  assert.equal(weightedScore([NaN, 20], [-1, 1]), 10);
});
