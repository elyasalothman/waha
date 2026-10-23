import assert from "node:assert/strict";
import { test } from "node:test";
import { checkIban, formatIban, normalizeIban } from "./iban-sa.ts";

const valid = "SA0380000000608010167519";

test("Saudi IBAN accepts a valid checksum and identifies its bank after normalization", () => {
  const raw = " sa03-8000 0000\t6080\n1016 7519 ";
  assert.equal(normalizeIban(raw), valid);
  assert.equal(formatIban(raw), "SA03 8000 0000 6080 1016 7519");
  const result = checkIban(raw);
  assert.equal(result.ok, true);
  assert.equal(result.bank?.en, "Al Rajhi Bank");
  assert.equal(result.formatted, formatIban(valid));
});

test("Saudi IBAN rejects each single-digit corruption, including check digits", () => {
  for (let i = 2; i < valid.length; i++) {
    const corrupted = valid.slice(0, i) + ((Number(valid[i]) + 1) % 10) + valid.slice(i + 1);
    assert.equal(checkIban(corrupted).ok, false, `accepted corruption at position ${i}`);
  }
});

test("Saudi IBAN distinguishes empty, country, length, format and checksum errors", () => {
  for (const [raw, reason] of [
    [" \n-", "Enter an IBAN"],
    ["GB0380000000608010167519", "A Saudi IBAN starts with SA"],
    [valid.slice(0, -1), "Length 23 — should be 24"],
    [valid + "0", "Length 25 — should be 24"],
    [valid.slice(0, -1) + "X", "Invalid format"],
    [valid.slice(0, -1) + "!", "Invalid format"],
    ["SA0480000000608010167519", "Checksum failed"],
  ]) {
    const result = checkIban(raw);
    assert.equal(result.ok, false);
    assert.equal(result.reasonEn, reason);
    assert.ok(result.reasonAr);
  }
});

test("Saudi IBAN checksum validation does not depend on the bank directory", () => {
  // Valid mod-97 checksum for a bank code outside the local display directory.
  const result = checkIban("SA1000000000000000000000");
  assert.equal(result.ok, true);
  assert.equal(result.bank, undefined);
});
