/** FABRICATED SAMPLE statements. No real accounts, names or balances. */
import test from "node:test";
import assert from "node:assert/strict";
import { parseMoneyCell, parseStatement, parseStatementCsv, parseStatementDate, parseStatementText, splitCsvLine } from "./bank-statement.ts";

const now = new Date(2026, 10, 21, 12, 0);

const RAJHI_AR_CSV = `\uFEFFكشف حساب - مصرف الراجحي
رقم الحساب,****5678
التاريخ,الوصف,مدين,دائن,الرصيد
2026/11/01,"إيداع راتب - جهة عمل نموذجية",,"8,500.00","9,700.00"
2026/11/02,شراء عبر نقاط البيع مدى PANDA RETAIL CO,45.50,,"9,654.50"
2026/11/02,شراء عبر نقاط البيع مدى PANDA RETAIL CO,45.50,,"9,609.00"
2026/11/03,شراء إنترنت NETFLIX.COM,48.75,,"9,560.25"
2026/11/04,حوالة صادرة إلى محمد أحمد,"1,000.00",,"8,560.25"
2026/11/05,سحب نقدي صراف,500.00,,"8,060.25"
2026/11/06,استرداد NOON,,120.00,"8,180.25"
مجموع,,,,
`;

const RAJHI_EN_CSV = `Date;Description;Debit;Credit;Balance
05-11-2026;POS Purchase mada STARBUCKS OLAYA;18,00;;1.234,50
06-11-2026;Incoming Transfer OMAR SAMPLE;;750,00;1.984,50
`;

const SIGNED_CSV = `Transaction Date,Details,Amount
2026-11-07,UBER TRIP,-32.40
2026-11-08,Salary Payroll,"9,000.00"
2026-11-09,SADAD STC BILL,(230.00)
2026-11-10,JAHEZ,15.00
`;

test("Al Rajhi Arabic CSV: debit/credit columns, quotes, BOM, preamble", () => {
  const result = parseStatementCsv(RAJHI_AR_CSV, { now });
  assert.equal(result.format, "csv");
  assert.equal(result.parsed.length, 7);
  assert.equal(result.skipped, 1);
  const [salary, panda1, panda2, netflix, transfer, atm, refund] = result.parsed;
  assert.equal(salary.direction, "income");
  assert.equal(salary.kind, "salary");
  assert.equal(salary.amount, 8500);
  assert.equal(panda1.direction, "expense");
  assert.equal(panda1.amount, 45.5);
  assert.equal(panda1.categoryId, "food");
  assert.equal(panda1.merchant.includes("PANDA"), true);
  assert.notEqual(panda1.fingerprint, panda2.fingerprint, "two identical purchases on one day both count");
  assert.equal(netflix.kind, "online");
  assert.equal(transfer.kind, "transfer_out");
  assert.equal(atm.kind, "atm");
  assert.equal(refund.kind, "refund");
  assert.equal(refund.direction, "income");
  assert.equal(result.parsed.every((tx) => tx.source === "statement" && tx.bank === "alrajhi"), true);
});

test("re-importing the same CSV gives the same fingerprints", () => {
  const a = parseStatementCsv(RAJHI_AR_CSV, { now }).parsed.map((tx) => tx.fingerprint);
  const b = parseStatementCsv(RAJHI_AR_CSV, { now }).parsed.map((tx) => tx.fingerprint);
  assert.deepEqual(a, b);
});

test("semicolon CSV with European decimals", () => {
  const result = parseStatementCsv(RAJHI_EN_CSV, { now });
  assert.equal(result.parsed.length, 2);
  assert.equal(result.parsed[0].amount, 18);
  assert.equal(result.parsed[0].date, "2026-11-05");
  assert.equal(result.parsed[1].direction, "income");
  assert.equal(result.parsed[1].amount, 750);
});

test("single signed amount column", () => {
  const result = parseStatementCsv(SIGNED_CSV, { now });
  assert.equal(result.parsed.length, 4);
  assert.deepEqual(
    result.parsed.map((tx) => [tx.direction, tx.amount, tx.categoryId]),
    [
      ["expense", 32.4, "transport"],
      ["income", 9000, "income"],
      ["expense", 230, "bills"],
      ["expense", 15, "food"],
    ],
  );
});

const PDF_TEXT = `مصرف الراجحي - كشف حساب
الفترة 2026/11/01 - 2026/11/30
2026/11/01 الرصيد الافتتاحي 1,200.00
2026/11/01 إيداع راتب 8,500.00 9,700.00
2026/11/02 شراء نقاط بيع مدى PANDA 45.50 9,654.50
2026/11/03 حوالة محلية إلى سارة 200.00 9,454.50
2026/11/04 تحويل من خالد 300.00 9,754.50
صفحة 1 من 2`;

test("PDF text paste: the balance change decides the direction", () => {
  const result = parseStatementText(PDF_TEXT, { now });
  const rows = result.parsed.map((tx) => [tx.date, tx.direction, tx.amount]);
  assert.deepEqual(rows.slice(-4), [
    ["2026-11-01", "income", 8500],
    ["2026-11-02", "expense", 45.5],
    ["2026-11-03", "expense", 200],
    ["2026-11-04", "income", 300],
  ]);
  assert.equal(result.parsed.find((tx) => tx.amount === 45.5)?.categoryId, "food");
});

test("parseStatement picks the right reader", () => {
  assert.equal(parseStatement(RAJHI_AR_CSV, { now }).format, "csv");
  assert.equal(parseStatement(PDF_TEXT, { now }).format, "text");
  assert.equal(parseStatement("hello", { now }).parsed.length, 0);
});

test("cells, money and dates", () => {
  assert.deepEqual(splitCsvLine('a,"b, c","d ""q"""', ","), ["a", "b, c", 'd "q"']);
  assert.equal(parseMoneyCell("1,250.00"), 1250);
  assert.equal(parseMoneyCell("(45.00)"), -45);
  assert.equal(parseMoneyCell("45.00-"), -45);
  assert.equal(parseMoneyCell("1.234,50"), 1234.5);
  assert.equal(parseMoneyCell("SAR 10"), 10);
  assert.equal(parseMoneyCell(""), null);
  assert.equal(parseMoneyCell("abc"), null);
  assert.equal(parseStatementDate("2026/11/02", now), "2026-11-02");
  assert.equal(parseStatementDate("02/11/2026", now), "2026-11-02");
  assert.equal(parseStatementDate("٠٢-١١-٢٠٢٦", now), "2026-11-02");
  assert.equal(parseStatementDate("3 Nov 2026", now), "2026-11-03");
  assert.equal(parseStatementDate("2027/01/01", now), null);
});
