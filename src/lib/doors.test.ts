import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALHAJDA_SITES_INDEX,
  DOORS,
  MIDAD_SHELF_PATH,
  directoryDoors,
  doorHref,
  doorOpenHref,
  doorOpensInternalShelf,
  getDoor,
  isExternalDoor,
  launcherDoors,
  primaryLauncherDoors,
} from "./doors.ts";

describe("Alhajda doors", () => {
  it("shows the three live doors with explicit Arabic labels and real URLs", () => {
    const tahajjud = getDoor("tahajjud");
    const midad = getDoor("midad");
    const sites = getDoor("sites");

    assert.equal(tahajjud?.title.ar, "تهجد · عبادة");
    assert.equal(tahajjud?.href, "https://tahajjud.alhajda.com");
    assert.equal(midad?.title.ar, "مداد · رف كتب");
    assert.equal(midad?.href, "https://midad.alhajda.com/library");
    assert.equal(sites?.title.ar, "مواقعنا");
    assert.equal(sites?.href, ALHAJDA_SITES_INDEX);
    assert.equal(isExternalDoor(sites!), true);
    assert.equal(doorHref(sites!), "https://alhajda.com/sites");

    assert.deepEqual(
      primaryLauncherDoors().map((d) => d.id),
      ["tahajjud", "midad", "sites"],
    );
    assert.deepEqual(
      launcherDoors().map((d) => d.id),
      ["tahajjud", "midad", "sites"],
    );
  });

  it("opens house products in the same tab via https — never an iframe src", () => {
    for (const door of launcherDoors()) {
      assert.match(door.href, /^https:\/\/([a-z0-9-]+\.)?alhajda\.com(\/.*)?$/);
      assert.equal(doorHref(door), door.href);
    }
    assert.equal(
      DOORS.some((d) => /iframe|embed/i.test(`${d.href}${d.blurb.ar}${d.blurb.en}`)),
      false,
    );
  });

  it("keeps the short مواقعنا directory without cloning extra launcher cards", () => {
    assert.equal(ALHAJDA_SITES_INDEX, "https://alhajda.com/sites");
    assert.deepEqual(
      directoryDoors().map((d) => d.id),
      ["tahajjud", "midad", "mohsin", "luma", "alhajda-tools", "agent", "hissati"],
    );
    assert.equal(getDoor("hissati")?.href, "https://hissati.alhajda.com");
  });

  it("opens باب مداد onto the /books shelf while the live library href stays canonical", () => {
    const midad = getDoor("midad");
    assert.equal(MIDAD_SHELF_PATH, "/books");
    assert.equal(doorOpensInternalShelf(midad!), true);
    assert.equal(doorOpenHref(midad!), "/books");
    assert.equal(doorHref(midad!), "https://midad.alhajda.com/library");
    assert.equal(doorOpensInternalShelf({ id: "tahajjud" }), false);
  });
});
