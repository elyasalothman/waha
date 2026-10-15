import test from "node:test";
import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { splitText, validateBook, mayPublish } from "./model.ts";
import { readZip } from "./zip.ts";
import { saveDraft, getDraft, listDrafts, deleteDraft } from "./local.ts";
import "fake-indexeddb/auto";

test("Arabic and Markdown chapter boundaries retain all prose", () => {
  const chapters = splitText("# بداية\nنص أول\n\nالفصل الثاني\nنص ثان\nوسطر ثالث");
  assert.deepEqual(chapters, [
    { title: "بداية", paragraphs: ["نص أول"] },
    { title: "الفصل الثاني", paragraphs: ["نص ثان", "وسطر ثالث"] },
  ]);
  assert.throws(() => splitText("  "), /OCR/);
  assert.throws(() => splitText("a".repeat(1_000_001)), /مليون/);
});
const book = {
  id: "draft-test",
  title: "كتاب اختبار",
  author: "المالك",
  category: "أدب",
  audience: "الجميع",
  cover: "",
  chapters: splitText("# البداية\nهذا نص أصلي للاختبار."),
};
test("local draft round-trip survives opening a new database connection", async () => {
  await saveDraft(book);
  assert.deepEqual(await getDraft(book.id), book);
  assert.equal(
    (await listDrafts()).some((b) => b.id === book.id),
    true,
  );
  await deleteDraft(book.id);
  assert.equal(await getDraft(book.id), undefined);
});
test("public schema rejects active cover content and malformed chapters", () => {
  assert.throws(() => validateBook({ ...book, cover: "javascript:alert(1)" }));
  assert.throws(() => validateBook({ ...book, cover: "data:image/svg+xml;base64,AAAA" }));
  assert.throws(() => validateBook({ ...book, chapters: [{ title: "x", paragraphs: [null] }] }));
  assert.throws(() => validateBook({ ...book, author: " " }));
  // Markup stays a plain string; the reader renders it through React text nodes.
  assert.equal(
    validateBook({ ...book, chapters: [{ title: "x", paragraphs: ["<script>alert(1)</script>"] }] })
      .chapters[0].paragraphs[0],
    "<script>alert(1)</script>",
  );
});
test("publisher authorization uses exact server IDs and denies missing configuration", () => {
  assert.equal(mayPublish("owner", " owner,other "), true);
  assert.equal(mayPublish("own", "owner"), false);
  assert.equal(mayPublish(undefined, "owner"), false);
  assert.equal(mayPublish("owner", undefined), false);
  assert.equal(mayPublish("dev-user", "owner"), false);
});
function zip(name: string, content: string, advertised?: number) {
  const filename = Buffer.from(name);
  const data = Buffer.from(content);
  const compressed = deflateRawSync(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(filename.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(advertised ?? data.length, 24);
  central.writeUInt16LE(filename.length, 28);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(local.length + filename.length + compressed.length, 16);
  const bytes = Buffer.concat([local, filename, compressed, central, filename, end]);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length);
}
test("ZIP extracts deflated documents and bounds declared and actual output", async () => {
  const files = await readZip(zip("word/document.xml", "<document>عربي</document>"));
  assert.equal(
    new TextDecoder().decode(files.get("word/document.xml")),
    "<document>عربي</document>",
  );
  await assert.rejects(readZip(zip("word/document.xml", "x", 5_000_000)), /كبير/);
  await assert.rejects(readZip(zip("word/document.xml", "x".repeat(4_000_001), 1)), /كبير/);
  await assert.rejects(readZip(new ArrayBuffer(10)));
});
