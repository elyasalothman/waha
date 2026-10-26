import test from "node:test";
import assert from "node:assert/strict";
import { arithmetic, solveMath } from "./math.ts";
const cases: [string, number][] = [
  ["2+3", 5],
  ["2+3*4", 14],
  ["(2+3)*4", 20],
  ["10/2", 5],
  ["2^3", 8],
  ["2^3^2", 512],
  ["-2^2", -4],
  ["(-2)^2", 4],
  ["√81", 9],
  ["جذر ١٤٤", 12],
  ["٢ أس ٥", 32],
  ["١٢+٣", 15],
  ["۲+۳", 5],
  [".5+.25", 0.75],
  ["100%", 1],
  ["كم ١٥٪ من ٢٤٠", 36],
  ["خصم ٣٠٪ على ٤٥٠", 315],
  ["10٪ من 50", 5],
  ["حل ٢س+٣=٧", 2],
  ["3x-6=0", 2],
  ["x=7", 7],
  ["2x=4x-8", 4],
  ["حول 1 كم إلى ميل", 1 / 1.609344],
  ["حول 1 ميل إلى كم", 1.609344],
  ["1 كجم إلى رطل", 1 / 0.45359237],
  ["1 رطل إلى كجم", 0.45359237],
  ["1 جالون إلى لتر", 3.785411784],
  ["1 لتر إلى جالون", 1 / 3.785411784],
  ["0 م إلى ف", 32],
  ["212 ف إلى م", 100],
  ["فرق بين 2026-01-01 و 2026-01-11", 10],
  ["عمري مواليد 2000-11-01", 25],
];
for (const [input, expected] of cases)
  test(`math: ${input}`, () =>
    assert.ok(
      Math.abs(solveMath(input, new Date("2026-10-25T12:00:00")).value! - expected) < 1e-8,
    ));
test("quadratic real roots and steps", () => {
  const r = solveMath("x^2-5x+6=0");
  assert.deepEqual(r.values, [2, 3]);
  assert.equal(r.steps.length, 2);
});
test("quadratic repeated root", () => assert.deepEqual(solveMath("x^2-2x+1=0").values, [1]));
test("no real roots", () => assert.match(solveMath("x^2+1=0").text, /لا توجد/));
test("identity and contradiction", () => {
  assert.match(solveMath("x=x").text, /غير محدود/);
  assert.match(solveMath("x=x+1").text, /لا يوجد/);
});
for (const input of ["1/0", "globalThis.process.exit()", "2+", "2**2", "(1+2", "x^3=0"])
  test(`reject ${input}`, () => assert.throws(() => solveMath(input)));
test("arithmetic source limit", () => assert.throws(() => arithmetic("1+".repeat(500))));

test("convert Gregorian Arabic digits to Hijri", () => {
  assert.equal(solveMath("حول ٢٠٢٦/١٠/٢٥ ميلادي إلى هجري").text, "1448/5/14 هجري");
});
test("convert Hijri Arabic digits to Gregorian", () => {
  assert.equal(solveMath("حول ١٤٤٨/٤/١ هجري إلى ميلادي").text, "2026/9/12 ميلادي");
});
test("calendar round trip", () => {
  const hijri = solveMath("حول 2026/10/25 ميلادي إلى هجري").text;
  assert.equal(solveMath(`حول ${hijri} إلى ميلادي`).text, "2026/10/25 ميلادي");
});
for (const input of [
  "حول 2026/2/30 ميلادي إلى هجري",
  "حول 1448/13/1 هجري إلى ميلادي",
  "حول 1448/4/31 هجري إلى ميلادي",
])
  test(`invalid calendar ${input}`, () => assert.throws(() => solveMath(input)));
