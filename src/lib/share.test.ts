import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { composeShareText, shareOrCopy } from "./share.ts";

describe("shareOrCopy", () => {
  it("composes title, text, and url for clipboard fallback", () => {
    assert.equal(
      composeShareText({ title: "واحة", text: "آية اليوم", url: "https://waha.hajdah.com" }),
      "واحة\nآية اليوم\nhttps://waha.hajdah.com",
    );
  });

  it("uses the Web Share API when the sheet is available", async () => {
    const calls: unknown[] = [];
    const result = await shareOrCopy(
      { title: "واحة", text: "ظل اليوم" },
      {
        share: {
          share: async (data) => {
            calls.push(data);
          },
          canShare: () => true,
        },
      },
    );
    assert.equal(result, "shared");
    assert.equal(calls.length, 1);
  });

  it("copies when share is missing or aborted without a clipboard error", async () => {
    const copied: string[] = [];
    const missing = await shareOrCopy(
      { text: "آية" },
      { clipboard: { writeText: async (value) => void copied.push(value) } },
    );
    assert.equal(missing, "copied");

    const aborted = await shareOrCopy(
      { text: "آية" },
      {
        share: {
          share: async () => {
            const err = new Error("dismissed");
            err.name = "AbortError";
            throw err;
          },
        },
        clipboard: { writeText: async (value) => void copied.push(value) },
      },
    );
    assert.equal(aborted, "failed");
    assert.deepEqual(copied, ["آية"]);
  });
});
