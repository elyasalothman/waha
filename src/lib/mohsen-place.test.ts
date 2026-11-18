import test from "node:test";
import assert from "node:assert/strict";
import { muhsinDeviceNotes, MUHSIN_PLACES } from "./mohsen-place.ts";
import { richBlocks } from "./mohsen-rich.ts";

test("device notes repeat only stored reading and budget figures", () => {
  const notes = muhsinDeviceNotes(
    {
      getItem(key) {
        if (key === "waha:curated:alhajda:edition1") return JSON.stringify({ chapter: 2, savedAt: "2026-11-01T00:00:00.000Z" });
        if (key === "waha:mizaniya:v1")
          return JSON.stringify({ version: 1, entries: [{ kind: "expense", amount: 40, on: "2026-11-02" }] });
        return null;
      },
    },
    new Date(2026, 10, 18),
  );
  assert.match(notes[0] ?? "", /الهجدة/);
  assert.match(notes[1] ?? "", /40 ريال/);
  assert.doesNotMatch(notes.join(" "), /شراء|بيع|أشعر/);
  assert.equal(muhsinDeviceNotes({ getItem: () => null }).length, 0);
  assert.ok(MUHSIN_PLACES.some((place) => place.href === "/app/budget"));
});

test("answers can show a table and a list without becoming html", () => {
  const blocks = richBlocks("مقدمة\n\n| البند | القيمة |\n| --- | --- |\n| مصروف | 40 |\n\n- المكتبة\n- الأخبار");
  assert.equal(blocks[0]?.type, "p");
  assert.equal(blocks[1]?.type, "table");
  if (blocks[1]?.type === "table") {
    assert.deepEqual(blocks[1].headers, ["البند", "القيمة"]);
    assert.deepEqual(blocks[1].rows[0], ["مصروف", "40"]);
  }
  assert.equal(blocks[2]?.type, "list");
  assert.equal(richBlocks("<script>alert(1)</script>")[0]?.type, "p");
});
