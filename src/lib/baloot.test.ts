import { test } from "node:test";
import assert from "node:assert/strict";
import { newHand, noProjects, scoreHand, matchScore, validGame, projectPoints } from "./baloot.ts";
test("normal hokom and sun, complementary counts and buyer loss before rounding", () => {
  const h = newHand();
  assert.deepEqual(scoreHand(h).points, [10, 6]);
  assert.deepEqual(scoreHand({ ...h, raw: 80 }).points, [0, 16]);
  assert.deepEqual(scoreHand({ ...h, mode: "sun", raw: 80 }).points, [16, 10]);
  assert.deepEqual(scoreHand({ ...h, mode: "sun", raw: 60 }).points, [0, 26]);
  assert.deepEqual(scoreHand({ ...h, raw: 81 }).points, [8, 8]);
  assert.deepEqual(scoreHand({ ...h, mode: "sun", raw: 65 }).points, [13, 13]);
});
test("all raw values and both buyers conserve normal hand total when successful", () => {
  for (const mode of ["hokom", "sun"] as const)
    for (const buyer of [0, 1] as const)
      for (let raw = 0; raw <= (mode === "sun" ? 130 : 162); raw++) {
        const result = scoreHand({ ...newHand(), mode, buyer, raw });
        assert.equal(result.points[0] + result.points[1], mode === "sun" ? 26 : 16);
      }
});
test("rounding counts nonbuyer, five down in hokom and up in sun", () => {
  assert.deepEqual(scoreHand({ ...newHand(), raw: 107 }).points, [11, 5]);
  assert.deepEqual(scoreHand({ ...newHand(), raw: 106 }).points, [10, 6]);
  assert.deepEqual(scoreHand({ ...newHand(), mode: "sun", raw: 102 }).points, [20, 6]);
});
test("every project value in each mode", () => {
  for (const [key, h, s] of [
    ["sara", 2, 4],
    ["fifty", 5, 10],
    ["hundred", 10, 20],
    ["fourHundred", 0, 40],
  ] as const) {
    const p = { ...noProjects(), [key]: 1 };
    assert.equal(projectPoints(p, "hokom"), h);
    assert.equal(projectPoints(p, "sun"), s);
  }
});
test("double projects only at double; baloot never multiplied", () => {
  const h = newHand();
  h.projects[0].sara = 1;
  h.projects[0].baloot = 1;
  for (const [level, expected] of [
    [1, 14],
    [2, 38],
    [3, 52],
    [4, 68],
  ] as const)
    assert.equal(scoreHand({ ...h, level }).points[0], expected);
});
test("projects determine loss using raw strength, and loss transfers total", () => {
  const h = newHand();
  h.projects[1].fifty = 1;
  assert.deepEqual(scoreHand({ ...h, mode: "sun", raw: 89 }).points, [0, 36]);
  assert.deepEqual(scoreHand({ ...newHand(), buyerLost: true }).points, [0, 16]);
});
test("kaboot in each mode, with double and only winners projects", () => {
  for (const mode of ["hokom", "sun"] as const)
    for (const level of [1, 2] as const) {
      const h = { ...newHand(), mode, level, kaboot: 0 as const };
      h.projects[1].hundred = 1;
      assert.deepEqual(scoreHand(h).points, [mode === "sun" ? 44 : 25, 0]);
    }
});
test("coffee wins immediately; undo/edit recomputes match and simultaneous threshold uses higher score", () => {
  const h = { ...newHand(), level: 5 as const };
  const r = { id: "a", hand: h };
  assert.equal(matchScore([r]).winner, 0);
  assert.equal(matchScore([]).winner, null);
  assert.equal(matchScore([{ ...r, hand: { ...h, buyerLost: true } }]).winner, 1);
  assert.equal(
    matchScore(Array.from({ length: 16 }, (_, i) => ({ id: String(i), hand: newHand() }))).winner,
    0,
  );
});
test("invalid inputs and storage rejected", () => {
  for (const raw of [-1, 163, NaN, 1.5]) assert.throws(() => scoreHand({ ...newHand(), raw }));
  assert.throws(() => scoreHand({ ...newHand(), mode: "sun", level: 3 }));
  assert.equal(validGame(null), null);
  assert.equal(validGame({ names: ["لنا", "لهم"], rounds: [{ id: "x", hand: {} }] }), null);
  assert.ok(validGame({ names: ["لنا", "لهم"], rounds: [{ id: "x", hand: newHand() }] }));
});

test("doubled raw ties go to original buyer, and sun double is 52", () => {
  assert.deepEqual(scoreHand({ ...newHand(), raw: 81, level: 2 }).points, [32, 0]);
  assert.deepEqual(scoreHand({ ...newHand(), raw: 81, level: 3 }).points, [48, 0]);
  assert.deepEqual(scoreHand({ ...newHand(), mode: "sun", raw: 80, level: 2 }).points, [52, 0]);
});
test("both teams past 152 use highest total, tied totals continue", () => {
  const rounds = Array.from({ length: 19 }, (_, i) => ({
    id: String(i),
    hand: { ...newHand(), raw: 81 },
  }));
  assert.deepEqual(matchScore(rounds), { totals: [152, 152], winner: null });
  assert.equal(matchScore([...rounds, { id: "extra", hand: newHand() }]).winner, 0);
});
test("kaboot winner projects survive; losing projects and baloot disappear", () => {
  const h = newHand();
  h.projects[0].fifty = 1;
  h.projects[0].baloot = 1;
  assert.deepEqual(scoreHand({ ...h, kaboot: 0, level: 2 }).points, [37, 0]);
  assert.deepEqual(scoreHand({ ...h, kaboot: 1, level: 2 }).points, [0, 25]);
});
