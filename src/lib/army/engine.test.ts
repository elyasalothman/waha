import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ARMY_CAP, LEVELS, applyOp, endlessStage, op, opLabel } from "./levels.ts";
import { createGame, fireLosses, maxArmyX, simulate, startArmy, step, steer } from "./engine.ts";
import { buyUpgrade, emptySave, parseSave, upgradeCost } from "./save.ts";

const BASE = { start: 0, rate: 0, income: 0 };

describe("جيش الواحة — gates", () => {
  it("parses and labels ops with Western digits", () => {
    assert.deepEqual(op("+5"), { kind: "add", v: 5 });
    assert.deepEqual(op("−10"), { kind: "sub", v: 10 });
    assert.deepEqual(op("×2"), { kind: "mul", v: 2 });
    assert.deepEqual(op("÷2"), { kind: "div", v: 2 });
    assert.equal(opLabel(op("x3")), "×3");
    assert.match(opLabel(op("-12")), /^[−+×÷][0-9]+$/);
  });
  it("applies ops, never below zero, never above the cap", () => {
    assert.equal(applyOp(10, op("+5")), 15);
    assert.equal(applyOp(3, op("-10")), 0);
    assert.equal(applyOp(7, op("/2")), 4);
    assert.equal(applyOp(800, op("x3")), ARMY_CAP);
  });
});

describe("جيش الواحة — levels", () => {
  it("has ten handcrafted levels with rising boss health", () => {
    assert.equal(LEVELS.length, 10);
    for (let i = 1; i < LEVELS.length; i++) assert.ok(LEVELS[i].boss.hp > LEVELS[i - 1].boss.hp);
    for (const L of LEVELS) for (const e of L.entities) assert.ok(e.at > 20 && e.at < L.length, `${L.id}`);
  });
  it("every level is winnable with no upgrades by good play", () => {
    for (const L of LEVELS) {
      const s = simulate(L, BASE, 1);
      assert.equal(s.phase, "won", `level ${L.id} should be winnable`);
      assert.ok(s.army.n > 0);
    }
  });
  it("choices matter: always picking the worse gate loses from level 2 on", () => {
    for (const L of LEVELS.slice(1)) assert.equal(simulate(L, BASE, 0).phase, "lost", `level ${L.id}`);
  });
  it("endless stages are deterministic and get harder", () => {
    assert.deepEqual(endlessStage(3, 100), endlessStage(3, 100));
    assert.ok(endlessStage(12, 300).boss.hp > endlessStage(2, 300).boss.hp);
  });
});

describe("جيش الواحة — engine", () => {
  it("starts with the upgraded army size", () => {
    assert.equal(startArmy(BASE), 4);
    assert.equal(createGame(LEVELS[0], { ...BASE, start: 3 }).army.n, 10);
  });
  it("steering is clamped to the bridge", () => {
    const s = createGame(LEVELS[0], BASE);
    steer(s, 99);
    assert.ok(s.army.targetX <= maxArmyX(s.army.n));
  });
  it("fire only burns soldiers standing in it", () => {
    assert.equal(fireLosses(10, 4, -1), 0);
    assert.ok(fireLosses(10, -3, -1) > 5);
  });
  it("crossing a gate changes the army and emits an event", () => {
    const s = createGame(LEVELS[0], BASE);
    steer(s, -3);
    const seen: string[] = [];
    for (let i = 0; i < 60 * 5; i++) {
      step(s, 1 / 60);
      for (const e of s.events) seen.push(e.t);
      s.events.length = 0;
    }
    assert.ok(seen.includes("gate"));
    assert.equal(s.army.n, 9); // 4 + 5 on the left gate
  });
});

describe("جيش الواحة — save", () => {
  it("parses junk safely and clamps values", () => {
    assert.deepEqual(parseSave("{bad"), emptySave());
    const s = parseSave(JSON.stringify({ coins: -5, unlocked: 99, upgrades: { start: 999 } }));
    assert.equal(s.coins, 0);
    assert.equal(s.unlocked, 11);
    assert.equal(s.upgrades.start, 20);
  });
  it("buys upgrades only when affordable", () => {
    const s = { ...emptySave(), coins: upgradeCost("start", 0) };
    assert.equal(buyUpgrade({ ...s, coins: 0 }, "start"), null);
    const b = buyUpgrade(s, "start")!;
    assert.equal(b.upgrades.start, 1);
    assert.equal(b.coins, 0);
  });
});
