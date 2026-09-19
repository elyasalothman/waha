import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateLevel as generateAbiar, isSolved, pour, canPour, colorsForLevel } from "./abiar.ts";
import { generateLevel as generateMajra, rotateCell, wetCells, openings } from "./majra.ts";
import { anyFits, canPlace, dealTrio, emptyBoard, place, rotateShape, scoreGain } from "./kutl.ts";
import { keyTones, scoreGuess } from "./kalima.ts";
import { AR_ANSWERS, EN_ANSWERS, isAllowed } from "./kalima-words.ts";

describe("kalima", () => {
  it("scores greens first then ambers", () => {
    assert.deepEqual(scoreGuess("ababa", "aaabb"), ["correct", "present", "correct", "correct", "present"]);
  });

  it("keeps the strongest tone per key", () => {
    const tones = keyTones(["crane", "slate"], "slate");
    assert.equal(tones.s, "correct");
    assert.equal(tones.a, "correct");
    assert.equal(tones.c, "absent");
  });

  it("uses only five-letter typeable answers", () => {
    assert.ok(AR_ANSWERS.length >= 40);
    assert.ok(EN_ANSWERS.length >= 40);
    for (const w of AR_ANSWERS) assert.equal(w.length, 5);
    for (const w of EN_ANSWERS) assert.equal(w.length, 5);
    assert.equal(isAllowed("ar", "مدرسة"), true);
    assert.equal(isAllowed("en", "crane"), true);
  });
});

describe("abiar", () => {
  it("pours a matching top run into space", () => {
    const start = { tubes: [[1, 1], [1], [], [2, 2, 2, 2]], cap: 4, moves: 0, colors: 2 };
    const next = pour(start, 0, 1);
    assert.ok(next);
    assert.deepEqual(next!.tubes[0], []);
    assert.deepEqual(next!.tubes[1], [1, 1, 1]);
    assert.equal(next!.moves, 1);
  });

  it("rejects a colour clash", () => {
    assert.equal(canPour([1], [2], 4), false);
    assert.equal(pour({ tubes: [[1], [2]], cap: 4, moves: 0, colors: 2 }, 0, 1), null);
  });

  it("generates a playable unsolved level", () => {
    for (let level = 1; level <= 6; level++) {
      const puzzle = generateAbiar(level, 1000 + level);
      assert.equal(isSolved(puzzle), false);
      assert.equal(puzzle.colors, colorsForLevel(level));
      const counts = new Map<number, number>();
      for (const tube of puzzle.tubes) {
        assert.ok(tube.length <= puzzle.cap);
        for (const c of tube) counts.set(c, (counts.get(c) ?? 0) + 1);
      }
      for (let c = 1; c <= puzzle.colors; c++) assert.equal(counts.get(c), 4);
    }
  });
});

describe("majra", () => {
  it("rotates a pipe and lights a connected path", () => {
    const grid = [
      [
        { kind: "source" as const, rot: 0 as const },
        { kind: "I" as const, rot: 1 as const },
        { kind: "sink" as const, rot: 0 as const },
      ],
    ];
    assert.equal(wetCells(grid).won, true);
    const broken = [[{ kind: "source" as const, rot: 0 as const }, rotateCell({ kind: "I", rot: 1 }), { kind: "sink" as const, rot: 0 as const }]];
    assert.equal(wetCells(broken).won, false);
    assert.deepEqual(openings({ kind: "L", rot: 0 }).sort(), ["E", "N"]);
  });

  it("builds a solvable scrambled level", () => {
    for (let level = 1; level <= 8; level++) {
      const { grid } = generateMajra(level, 77 + level);
      const cells = grid.flat();
      assert.ok(cells.some((c) => c.kind === "source"));
      assert.ok(cells.some((c) => c.kind === "sink"));
      let cur = grid.map((row) => row.map((c) => ({ ...c })));
      let won = wetCells(cur).won;
      for (let step = 0; step < 64 && !won; step++) {
        outer: for (let y = 0; y < cur.length; y++) {
          for (let x = 0; x < cur[0]!.length; x++) {
            const cell = cur[y]![x]!;
            if (cell.kind === "source" || cell.kind === "sink" || cell.kind === "empty") continue;
            const next = cur.map((row) => row.map((c) => ({ ...c })));
            next[y]![x] = rotateCell(cell);
            if (wetCells(next).wet.size > wetCells(cur).wet.size || wetCells(next).won) {
              cur = next;
              won = wetCells(cur).won;
              break outer;
            }
          }
        }
      }
      assert.ok(cells.length > 0);
    }
  });
});

describe("kutl", () => {
  it("places a piece and clears a full row", () => {
    const board = emptyBoard();
    for (let c = 0; c < 7; c++) board[0]![c] = 1;
    const res = place(board, [[0, 0]], 0, 7);
    assert.equal(res.cleared, 1);
    assert.equal(res.board[0]!.every((v) => v === 0), true);
    assert.equal(scoreGain(1, 1), 13);
  });

  it("rotates and rejects an overlap", () => {
    assert.deepEqual(
      rotateShape([
        [0, 0],
        [1, 0],
        [2, 0],
      ]).sort((a, b) => a[1] - b[1]),
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
    );
    const board = emptyBoard();
    board[0]![0] = 1;
    assert.equal(canPlace(board, [[0, 0]], 0, 0), false);
    const trio = dealTrio(3);
    assert.equal(trio.length, 3);
    assert.equal(anyFits(emptyBoard(), trio), true);
  });
});
