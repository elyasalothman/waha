import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "./calculator.ts";
test("calculator precedence, Arabic digits, percentages and scientific degrees", () => {
  assert.equal(calculate("٢+٣×٤"), 14);
  assert.equal(calculate("-2^2"), -4);
  assert.equal(calculate("2^3^2"), 512);
  assert.equal(calculate("sin(30)"), 0.5);
  assert.equal(calculate("√(٩)+50%"), 3.5);
  assert.equal(calculate("1e+3/2"), 500);
});
test("calculator rejects executable code and undefined arithmetic", () => {
  for (const expression of ["alert(1)", "1/0", "sqrt(-1)", "1;2", "sin30", "1..2", "(1+2"])
    assert.throws(() => calculate(expression));
});
