/** FABRICATED SAMPLE data only. */
import test from "node:test";
import assert from "node:assert/strict";
import { parseBankSms, parseWalletTx } from "./bank-sms.ts";
import { parseStatementCsv } from "./bank-statement.ts";
import { emptyLedger, parseLedger, type Ledger } from "./mizaniya.ts";
import { hasIntake, intakeTransactions, isDuplicate, mergeTransactions, readIntake, recategorize, sameMerchant, txToEntry } from "./mizaniya-auto.ts";

const now = new Date(2026, 10, 21, 12, 0);
const SMS = "شراء عبر نقاط البيع\nبطاقة: 4321;مدى-ابل باي\nمبلغ: SAR 45.50\nلدى: PANDA RETAIL CO\nفي: 2026-11-21 10:32";

test("an SMS becomes one ledger entry; the same SMS again is a duplicate", () => {
  const tx = parseBankSms(SMS, { now });
  assert.ok(tx);
  const first = mergeTransactions(emptyLedger(), [tx]);
  assert.equal(first.added.length, 1);
  const entry = first.added[0];
  assert.equal(entry.kind, "expense");
  assert.equal(entry.amount, 45.5);
  assert.equal(entry.categoryId, "food");
  assert.equal(entry.source, "sms");
  assert.equal(entry.last4, "4321");
  assert.equal(entry.on, "2026-11-21");
  assert.equal(JSON.stringify(entry).includes("شراء عبر نقاط البيع\n"), false, "raw text is not stored");
  const again = mergeTransactions(first.ledger, [parseBankSms(SMS, { now, sender: "AlRajhiBank" })!]);
  assert.equal(again.added.length, 0);
  assert.equal(again.duplicates, 1);
  assert.equal(again.ledger, first.ledger);
});

test("Wallet + SMS for one purchase count once; statement row later also matches", () => {
  const wallet = parseWalletTx({ merchant: "Panda", amount: "SAR 45.50" }, { now })!;
  const sms = parseBankSms(SMS, { now })!;
  const step = mergeTransactions(emptyLedger(), [wallet]);
  const step2 = mergeTransactions(step.ledger, [sms]);
  assert.equal(step2.added.length, 0);
  assert.equal(step2.duplicates, 1);
  const statement = parseStatementCsv("Date,Description,Debit,Credit\n2026-11-21,POS PANDA RETAIL CO,45.50,\n", { now }).parsed;
  const step3 = mergeTransactions(step2.ledger, statement);
  assert.equal(step3.duplicates, 1);
  assert.equal(step3.ledger.entries.length, 1);
});

test("two real purchases with the same amount at different shops both stay", () => {
  const a = parseWalletTx({ merchant: "Panda", amount: "SAR 20" }, { now })!;
  const b = parseBankSms("شراء\nمبلغ: SAR 20\nلدى: KUDU\nفي: 2026-11-21 11:00", { now })!;
  const result = mergeTransactions(mergeTransactions(emptyLedger(), [a]).ledger, [b]);
  assert.equal(result.added.length, 1);
});

test("manual entries are never treated as duplicates of bank messages", () => {
  const ledger: Ledger = {
    ...emptyLedger(),
    entries: [{ id: "m", account: "personal", kind: "expense", amount: 45.5, categoryId: "food", note: "PANDA", on: "2026-11-21" }],
  };
  assert.equal(isDuplicate(ledger.entries, parseBankSms(SMS, { now })!), false);
});

test("foreign amounts without SAR go to review, not the ledger", () => {
  const tx = parseBankSms("شراء إنترنت\nمبلغ: EUR 9.99\nلدى: SPOTIFY\nفي: 2026-11-20", { now })!;
  const result = mergeTransactions(emptyLedger(), [tx]);
  assert.equal(result.added.length, 0);
  assert.equal(result.review.length, 1);
  assert.equal(txToEntry(tx, "personal"), null);
});

test("income entries get the income category and a readable note", () => {
  const tx = parseBankSms("حوالة واردة\nمبلغ: SAR 750\nمن: OMAR SAMPLE\nفي: 2026-11-20", { now })!;
  const entry = txToEntry(tx, "household")!;
  assert.equal(entry.kind, "income");
  assert.equal(entry.categoryId, "income");
  assert.equal(entry.account, "household");
  assert.equal(entry.note, "حوالة واردة: OMAR SAMPLE");
});

test("recategorize learns the merchant and moves its other auto entries", () => {
  const one = parseBankSms("شراء\nمبلغ: SAR 30\nلدى: MYSTERY SHOP\nفي: 2026-11-19 10:00", { now })!;
  const two = parseBankSms("شراء\nمبلغ: SAR 12\nلدى: MYSTERY SHOP\nفي: 2026-11-20 10:00", { now })!;
  const { ledger } = mergeTransactions(emptyLedger(), [one, two]);
  assert.equal(ledger.entries.every((entry) => entry.categoryId === "other"), true);
  const result = recategorize(ledger, {}, ledger.entries[0].id, "fun");
  assert.equal(result.ledger.entries.every((entry) => entry.categoryId === "fun"), true);
  assert.equal(result.map["mystery shop"], "fun");
  const three = parseBankSms("شراء\nمبلغ: SAR 9\nلدى: MYSTERY SHOP\nفي: 2026-11-21 09:00", { now, learned: result.map })!;
  assert.equal(three.categoryId, "fun");
  assert.deepEqual(recategorize(ledger, {}, "missing", "fun").ledger, ledger);
});

test("the extra entry fields survive a save and reload", () => {
  const { ledger } = mergeTransactions(emptyLedger(), [parseBankSms(SMS, { now })!]);
  const reloaded = parseLedger(JSON.stringify(ledger));
  assert.deepEqual(reloaded.entries[0], ledger.entries[0]);
  const tampered = parseLedger(JSON.stringify({ ...ledger, entries: [{ ...ledger.entries[0], last4: "4847123412341234", source: "x" }] }));
  assert.equal(tampered.entries[0].last4, undefined);
  assert.equal(tampered.entries[0].source, undefined);
});

test("URL intake: hash and query, many sms, wallet fields", () => {
  const hash = `#sms=${encodeURIComponent(SMS)}&sender=AlRajhiBank`;
  const intake = readIntake("", hash);
  assert.equal(intake.sms.length, 1);
  assert.equal(intake.sender, "AlRajhiBank");
  assert.equal(hasIntake(intake), true);
  const result = intakeTransactions(intake, {}, now);
  assert.equal(result.parsed.length, 1);
  assert.equal(result.parsed[0].bank, "alrajhi");
  const wallet = readIntake("?merchant=Starbucks&amount=SAR%2018.00&card=mada", "");
  assert.deepEqual(wallet.wallet, { merchant: "Starbucks", amount: "SAR 18.00", card: "mada" });
  assert.equal(intakeTransactions(wallet, {}, now).parsed[0].source, "wallet");
  assert.equal(hasIntake(readIntake("", "")), false);
  assert.equal(readIntake("?sms=a&sms=b", "").sms.length, 2);
});

test("merchant matching tolerates branch suffixes and empty names", () => {
  assert.equal(sameMerchant("PANDA RETAIL CO", "Panda"), true);
  assert.equal(sameMerchant("PANDA", "KUDU"), false);
  assert.equal(sameMerchant("", "KUDU"), true);
});
