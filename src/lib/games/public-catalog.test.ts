import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { CLASSIC_IDS, SIGNATURE_IDS } from "./doors.ts";
import { PUBLIC_GAME_IDS, isPublicGame } from "./public-catalog.ts";

test("the public games page lists only played in-app games", () => {
  const known = new Set<string>([...SIGNATURE_IDS, ...CLASSIC_IDS]);
  for (const id of PUBLIC_GAME_IDS) {
    assert.equal(isPublicGame(id), true);
    assert.ok(known.has(id), id);
  }
  assert.equal(isPublicGame("hayat-world"), false);
  assert.equal(isPublicGame("luma"), false);
  const page = readFileSync(new URL("../../components/games-hub.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /hayat\.alhajda\.com|games\.alhajda\.com|GAME_DOORS|HayatCard/);
  assert.match(page, /isPublicGame/);
  assert.match(page, /ArmyCard/);
});
