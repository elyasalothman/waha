import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { test } from "node:test";
import { initialReading, searchPages, type PrivateBook, type BookContent } from "./model.ts";
import { deletePrivateBook, getPrivateBook, listPrivateBooks, savePrivateBook, saveReading } from "./storage.ts";

test("private PDF content and reading anchors persist, deduplicate, and delete together", async () => {
  const book: PrivateBook = { id: "local-1", contentDigest: "digest", title: "كتاب",
    addedAt: 1, bytes: 10, pageCount: 1, textPages: 1, reviewPages: 0, formatVersion: 1 };
  const content: BookContent = { id: book.id, original: new Blob(["%PDF-test"]),
    pages: [{ number: 1, review: false, blocks: [{ id: "p1-b0", text: "أَهْلًا بالعالم", direction: "rtl" }] }] };
  assert.equal(await savePrivateBook(book, content), book.id);
  assert.equal(await savePrivateBook({ ...book, id: "duplicate" }, { ...content, id: "duplicate" }), book.id);
  assert.equal((await listPrivateBooks()).length, 1);
  const reading = { ...initialReading(book.id), anchor: { page: 1, block: "p1-b0" } };
  await saveReading(reading);
  const loaded = await getPrivateBook(book.id);
  assert.deepEqual(loaded.reading, reading);
  assert.equal(await loaded.content?.original.text(), "%PDF-test");
  assert.equal(searchPages(loaded.content!.pages, "اهلا")[0]?.block, "p1-b0");
  await deletePrivateBook(book.id);
  await saveReading(reading);
  assert.deepEqual(await getPrivateBook(book.id), { book: undefined, content: undefined, reading: undefined });
});
