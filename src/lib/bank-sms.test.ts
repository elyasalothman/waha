/**
 * All messages below are FABRICATED SAMPLES written to look like Saudi bank SMS formats.
 * Names, cards, accounts and amounts are invented. No real personal data.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  categorize,
  detectBank,
  extractDate,
  extractLast4,
  learnMerchant,
  merchantKey,
  normalizeText,
  parseBankSms,
  parseManySms,
  parseMerchantMap,
  parseWalletTx,
  splitMessages,
} from "./bank-sms.ts";

const now = new Date(2026, 10, 21, 12, 0);

type Expect = {
  kind: string;
  direction: "expense" | "income";
  amount: number;
  currency?: string;
  sar?: number | null;
  merchant?: string;
  last4?: string | null;
  date?: string;
  time?: string | null;
  channel?: string | null;
  categoryId?: string;
  bank?: string;
};

const SAMPLES: { name: string; sms: string; sender?: string; expect: Expect }[] = [
  // ── Al Rajhi, Arabic ──
  {
    name: "rajhi ar POS mada apple pay",
    sender: "AlRajhiBank",
    sms: "شراء عبر نقاط البيع\nبطاقة: 4321;مدى-ابل باي\nمبلغ: SAR 45.50\nلدى: PANDA RETAIL CO\nفي: 26-11-20 14:32",
    expect: { kind: "purchase", direction: "expense", amount: 45.5, merchant: "PANDA RETAIL CO", last4: "4321", date: "2026-11-20", time: "14:32", channel: "apple_pay", categoryId: "food", bank: "alrajhi" },
  },
  {
    name: "rajhi ar POS mada plain",
    sms: "شراء عبر نقاط البيع\nبطاقة: 4321;مدى\nمبلغ: 120 SAR\nلدى: ALDREES PETROL\nفي: 2026-11-19 07:40",
    expect: { kind: "purchase", direction: "expense", amount: 120, merchant: "ALDREES PETROL", last4: "4321", date: "2026-11-19", channel: "mada", categoryId: "transport" },
  },
  {
    name: "rajhi ar online foreign with SAR line",
    sms: "شراء إنترنت\nبطاقة: 4321;فيزا\nمبلغ: USD 12.99\nبالريال: SAR 48.75\nلدى: NETFLIX.COM\nفي: 20/11/26 09:10",
    expect: { kind: "online", direction: "expense", amount: 12.99, currency: "USD", sar: 48.75, merchant: "NETFLIX.COM", date: "2026-11-20", channel: "online", categoryId: "fun" },
  },
  {
    name: "rajhi ar online foreign no SAR line",
    sms: "شراء عبر الإنترنت\nبطاقة: 4321;فيزا\nمبلغ: EUR 9.99\nلدى: SPOTIFY\nفي: 2026-11-18 23:00",
    expect: { kind: "online", direction: "expense", amount: 9.99, currency: "EUR", sar: null, merchant: "SPOTIFY", categoryId: "fun" },
  },
  {
    name: "rajhi ar online SAR",
    sms: "شراء انترنت\nبطاقة: 4321;مدى\nمبلغ: SAR 64.00\nلدى: HUNGERSTATION\nفي: 2026-11-17 21:05",
    expect: { kind: "online", direction: "expense", amount: 64, merchant: "HUNGERSTATION", categoryId: "food" },
  },
  {
    name: "rajhi ar transfer out",
    sms: "حوالة محلية صادرة\nمن: 5678\nمبلغ: SAR 1,000.00\nإلى: محمد أحمد\nفي: 26-11-19 10:05",
    expect: { kind: "transfer_out", direction: "expense", amount: 1000, merchant: "محمد أحمد", last4: "5678", date: "2026-11-19", categoryId: "other" },
  },
  {
    name: "rajhi ar transfer in",
    sms: "حوالة واردة\nمبلغ: SAR 2,500.00\nمن: شركة نموذجية للتجارة\nإلى: 5678\nفي: 2026-11-19 08:00",
    expect: { kind: "transfer_in", direction: "income", amount: 2500, merchant: "شركة نموذجية للتجارة", last4: "5678", categoryId: "income" },
  },
  {
    name: "rajhi ar salary",
    sms: "إيداع راتب\nمبلغ: SAR 8,500.00\nمن: جهة عمل نموذجية\nحساب: **5678\nفي: 2026-11-01 06:00",
    expect: { kind: "salary", direction: "income", amount: 8500, last4: "5678", date: "2026-11-01", categoryId: "income" },
  },
  {
    name: "rajhi ar ATM",
    sms: "سحب نقدي (صراف آلي)\nبطاقة: 4321;مدى\nمبلغ: SAR 500\nلدى: RAJHI ATM OLAYA\nفي: 2026-11-18 21:10",
    expect: { kind: "atm", direction: "expense", amount: 500, last4: "4321", categoryId: "other" },
  },
  {
    name: "rajhi ar refund",
    sms: "استرداد مبلغ\nبطاقة: 4321;مدى\nمبلغ: SAR 120.00\nمن: NOON\nفي: 2026-11-16 12:00",
    expect: { kind: "refund", direction: "income", amount: 120, merchant: "NOON", categoryId: "income" },
  },
  {
    name: "rajhi ar bill payment",
    sms: "سداد فاتورة\nالمفوتر: STC\nمبلغ: SAR 230.00\nمن: 5678\nفي: 2026-11-15 10:00",
    expect: { kind: "bill", direction: "expense", amount: 230, merchant: "STC", last4: "5678", categoryId: "bills" },
  },
  {
    name: "rajhi ar with balance line",
    sms: "شراء عبر نقاط البيع\nبطاقة: 4321;مدى\nمبلغ: SAR 35.00\nلدى: AL BAIK\nالرصيد: SAR 4,120.10\nفي: 2026-11-20 13:00",
    expect: { kind: "purchase", direction: "expense", amount: 35, merchant: "AL BAIK", categoryId: "food" },
  },
  {
    name: "rajhi ar arabic-indic digits",
    sms: "شراء عبر نقاط البيع\nبطاقة: ٤٣٢١;مدى\nمبلغ: ٧٨٫٢٥ ريال\nلدى: صيدلية النهدي\nفي: ٢٠٢٦-١١-٢٠ ١٩:٤٥",
    expect: { kind: "purchase", direction: "expense", amount: 78.25, merchant: "صيدلية النهدي", last4: "4321", date: "2026-11-20", time: "19:45", categoryId: "health" },
  },
  // ── Al Rajhi, English ──
  {
    name: "rajhi en POS apple pay",
    sender: "AlRajhiBank",
    sms: "POS Purchase\nCard: 4321;mada-Apple Pay\nAmount: SAR 18.00\nAt: STARBUCKS OLAYA\nOn: 2026-11-20 08:05",
    expect: { kind: "purchase", direction: "expense", amount: 18, merchant: "STARBUCKS OLAYA", last4: "4321", time: "08:05", channel: "apple_pay", categoryId: "food", bank: "alrajhi" },
  },
  {
    name: "rajhi en online purchase",
    sms: "Online Purchase\nCard: 4321;Visa\nAmount: USD 20.00 (SAR 75.10)\nAt: STEAMGAMES.COM\nOn: 2026-11-14 22:30",
    expect: { kind: "online", direction: "expense", amount: 20, currency: "USD", sar: 75.1, categoryId: "fun" },
  },
  {
    name: "rajhi en outgoing transfer",
    sms: "Local Transfer\nFrom: 5678\nAmount: SAR 300.00\nTo: SARA ALI\nOn: 2026-11-13 18:00",
    expect: { kind: "transfer_out", direction: "expense", amount: 300, merchant: "SARA ALI", last4: "5678" },
  },
  {
    name: "rajhi en incoming transfer",
    sms: "Incoming Transfer\nAmount: SAR 750.00\nFrom: OMAR SAMPLE\nTo: 5678\nOn: 2026-11-12 09:00",
    expect: { kind: "transfer_in", direction: "income", amount: 750, merchant: "OMAR SAMPLE", categoryId: "income" },
  },
  {
    name: "rajhi en salary",
    sms: "Salary Deposit\nAmount: SAR 9,250.00\nAccount: **5678\nOn: 2026-10-27 05:30",
    expect: { kind: "salary", direction: "income", amount: 9250, last4: "5678", date: "2026-10-27" },
  },
  {
    name: "rajhi en ATM",
    sms: "ATM Withdrawal\nCard: 4321;mada\nAmount: SAR 200\nAt: ATM KING FAHD RD\nOn: 2026-11-11 20:00",
    expect: { kind: "atm", direction: "expense", amount: 200, categoryId: "other" },
  },
  {
    name: "rajhi en refund",
    sms: "Refund\nCard: 4321;mada\nAmount: SAR 59.00\nFrom: AMAZON.SA\nOn: 2026-11-10 10:10",
    expect: { kind: "refund", direction: "income", amount: 59, merchant: "AMAZON.SA" },
  },
  // ── Alinma ──
  {
    name: "alinma one-liner",
    sender: "alinma",
    sms: "عملية شراء عبر نقاط البيع بمبلغ 85.00 ريال من بطاقة مدى رقم ****1234 لدى JARIR BOOKSTORE بتاريخ 2026/11/19 الساعة 18:20 الرصيد المتاح 3,210.55 ريال",
    expect: { kind: "purchase", direction: "expense", amount: 85, merchant: "JARIR BOOKSTORE", last4: "1234", date: "2026-11-19", time: "18:20", bank: "alinma" },
  },
  {
    name: "alinma transfer in",
    sms: "مصرف الإنماء: تم إيداع حوالة واردة بمبلغ 1,200.00 ريال في حسابك رقم ***9012 من فهد نموذج بتاريخ 2026/11/18",
    expect: { kind: "transfer_in", direction: "income", amount: 1200, last4: "9012", bank: "alinma", date: "2026-11-18" },
  },
  // ── SNB ──
  {
    name: "snb online credit card",
    sender: "SNB-AlAhli",
    sms: "شراء عبر الإنترنت\nبطاقة ائتمانية: **9876\nمن: AMAZON.SA\nمبلغ: 199.00 SAR\nفي: 20/11/2026 13:45",
    expect: { kind: "online", direction: "expense", amount: 199, merchant: "AMAZON.SA", last4: "9876", date: "2026-11-20", bank: "snb" },
  },
  {
    name: "snb apple pay",
    sms: "البنك الأهلي السعودي\nشراء Apple Pay\nمدى **3333\nمبلغ 42.75 ريال\nلدى DANUBE\n2026-11-19 20:11",
    expect: { kind: "purchase", direction: "expense", amount: 42.75, merchant: "DANUBE", last4: "3333", channel: "apple_pay", categoryId: "food", bank: "snb" },
  },
  // ── Riyad ──
  {
    name: "riyad en",
    sender: "RiyadBank",
    sms: "Purchase transaction of SAR 75.25 at JARIR BOOKSTORE using card ending 5555 on 19-11-2026 17:02. Available balance SAR 2,000.00",
    expect: { kind: "purchase", direction: "expense", amount: 75.25, merchant: "JARIR BOOKSTORE", last4: "5555", date: "2026-11-19", time: "17:02", bank: "riyad" },
  },
  {
    name: "riyad ar",
    sms: "بنك الرياض: شراء بمبلغ 150.00 ر.س لدى IKEA بطاقة مدى ****6666 في 2026-11-18 16:40",
    expect: { kind: "purchase", direction: "expense", amount: 150, merchant: "IKEA", last4: "6666", categoryId: "home", bank: "riyad" },
  },
  // ── SAB ──
  {
    name: "sab en used for",
    sms: "Your SAB mada card ****2222 was used for SAR 33.00 at CAREEM RIDE on 18/11/2026 22:15",
    expect: { kind: "purchase", direction: "expense", amount: 33, merchant: "CAREEM RIDE", last4: "2222", date: "2026-11-18", categoryId: "transport", bank: "sab" },
  },
  {
    name: "sab ar",
    sender: "SAB",
    sms: "ساب: عملية شراء بقيمة 60.00 ريال لدى UBER من البطاقة المنتهية بـ 2222 بتاريخ 17/11/2026",
    expect: { kind: "purchase", direction: "expense", amount: 60, merchant: "UBER", last4: "2222", categoryId: "transport", bank: "sab" },
  },
  // ── STC Bank ──
  {
    name: "stc bank debit",
    sender: "STC Bank",
    sms: "تم خصم 25.00 ر.س من بطاقتك المنتهية بـ 7777 لدى STARBUCKS في 2026-11-20 08:15",
    expect: { kind: "purchase", direction: "expense", amount: 25, merchant: "STARBUCKS", last4: "7777", time: "08:15", bank: "stcbank", categoryId: "food" },
  },
  {
    name: "stc bank top-up",
    sms: "stc bank: تمت إضافة 300.00 ر.س إلى محفظتك من خالد",
    expect: { kind: "transfer_in", direction: "income", amount: 300, merchant: "خالد", bank: "stcbank" },
  },
  // ── odd formats ──
  {
    name: "SAR glued to number",
    sms: "Purchase\nAmount:SAR45.5\nAt: KUDU\nOn: 2026-11-20",
    expect: { kind: "purchase", direction: "expense", amount: 45.5, merchant: "KUDU", categoryId: "food" },
  },
  {
    name: "12h clock PM",
    sms: "POS Purchase SAR 10.00 at BARNS CAFE on 20/11/2026 3:05 PM",
    expect: { kind: "purchase", direction: "expense", amount: 10, time: "15:05", categoryId: "food" },
  },
  {
    name: "label without currency",
    sms: "شراء عبر نقاط البيع\nمبلغ: 19.00\nلدى: TAMIMI MARKETS\nفي: 2026-11-20 11:00",
    expect: { kind: "purchase", direction: "expense", amount: 19, currency: "SAR", merchant: "TAMIMI MARKETS", categoryId: "food" },
  },
];

for (const sample of SAMPLES) {
  test(`sms: ${sample.name}`, () => {
    const tx = parseBankSms(sample.sms, { now, sender: sample.sender });
    assert.ok(tx, "should parse");
    for (const [key, value] of Object.entries(sample.expect)) {
      assert.deepEqual((tx as Record<string, unknown>)[key], value, `${key}`);
    }
    assert.equal(tx.currency.length >= 3, true);
    assert.ok(tx.fingerprint.length > 4);
  });
}

const NOT_TRANSACTIONS = [
  "رمز التحقق: 482913 لعملية شراء بمبلغ 50.00 SAR لدى AMAZON. لا تشارك الرمز",
  "Your OTP is 553201 for a purchase of SAR 99.00 at SHEIN. Do not share it.",
  "عملية مرفوضة: شراء بمبلغ 300 ريال لدى EXTRA بسبب رصيد غير كاف",
  "Transaction declined: Purchase SAR 45.00 at NOON",
  "احصل على خصم 50 ريال عند الشراء بمدى من شركائنا",
  "عزيزي العميل، تم تحديث بياناتك بنجاح",
  "شراء عبر نقاط البيع بدون مبلغ",
  "",
];

test("non-transactions are ignored (OTP, declined, promo, notices)", () => {
  for (const message of NOT_TRANSACTIONS) assert.equal(parseBankSms(message, { now }), null, message);
});

test("only the last 4 digits ever come out, even from a full card number", () => {
  const tx = parseBankSms("شراء عبر نقاط البيع\nبطاقة: 4847 **** **** 1234\nمبلغ: SAR 10.00\nلدى: CAFE\nفي: 2026-11-20", { now });
  assert.equal(tx?.last4, "1234");
  const leaked = parseBankSms("Purchase SAR 10 at SHOP 4847123412341234 on 2026-11-20", { now });
  assert.ok(leaked);
  assert.equal(JSON.stringify(leaked).includes("4847123412341234"), false);
  assert.equal(extractLast4("ending in 9988"), "9988");
  assert.equal(extractLast4("no card here"), null);
});

test("same SMS twice gives the same fingerprint; sender does not change it", () => {
  const sms = SAMPLES[0].sms;
  const a = parseBankSms(sms, { now, sender: "AlRajhiBank" });
  const b = parseBankSms(sms, { now });
  assert.equal(a?.fingerprint, b?.fingerprint);
  const c = parseBankSms(sms.replace("45.50", "45.51"), { now });
  assert.notEqual(a?.fingerprint, c?.fingerprint);
});

test("dates: two-digit years take the reading nearest today; no future dates", () => {
  assert.equal(extractDate("في: 26-11-20", now).date, "2026-11-20");
  assert.equal(extractDate("في: 20-11-26", now).date, "2026-11-20");
  assert.equal(extractDate("on 05/11/2026", now).date, "2026-11-05");
  assert.equal(extractDate("2026/11/19", now).date, "2026-11-19");
  const missing = extractDate("no date", now);
  assert.equal(missing.found, false);
  assert.equal(missing.date, "2026-11-21");
  assert.equal(extractDate("on 01/12/2026", now).date, "2026-01-12");
});

test("bank detection by sender or text", () => {
  assert.equal(detectBank("", "AlRajhiBank"), "alrajhi");
  assert.equal(detectBank("مصرف الإنماء"), "alinma");
  assert.equal(detectBank("حسابك"), "unknown");
  assert.equal(detectBank("Your SAB card"), "sab");
  assert.equal(detectBank("stc bank"), "stcbank");
});

test("normalizeText converts Arabic digits and strips bidi marks", () => {
  assert.equal(normalizeText("\u200f١٢٣٫٤٥\u200e ريال"), "123.45 ريال");
});

test("categories: built-in map, kinds, and a learned map that wins", () => {
  assert.equal(categorize("JAHEZ", "online"), "food");
  assert.equal(categorize("UBER *TRIP", "purchase"), "transport");
  assert.equal(categorize("MYSTERY SHOP", "purchase"), "other");
  assert.equal(categorize("anyone", "salary"), "income");
  assert.equal(categorize("STC", "bill"), "bills");
  const learned = learnMerchant({}, "MYSTERY SHOP RIYADH", "fun");
  assert.equal(categorize("Mystery Shop", "purchase", learned), "fun");
  assert.equal(categorize("MYSTERY SHOP 22", "purchase", learned), "fun");
  assert.equal(merchantKey("PANDA RETAIL CO - RIYADH 123"), "panda retail");
  assert.deepEqual(learnMerchant({}, "x", "income"), {});
});

test("merchant map storage is validated", () => {
  const allowed = ["food", "other"];
  assert.deepEqual(parseMerchantMap(JSON.stringify({ panda: "food", bad: "nope", other: 3 }), allowed), { panda: "food" });
  assert.deepEqual(parseMerchantMap("not json", allowed), {});
  assert.deepEqual(parseMerchantMap(null, allowed), {});
});

test("a paste of many messages splits on blank lines and on new headers", () => {
  const paste = [SAMPLES[0].sms, SAMPLES[1].sms, SAMPLES[5].sms].join("\n\n");
  assert.equal(splitMessages(paste).length, 3);
  const glued = `${SAMPLES[0].sms}\n${SAMPLES[1].sms}`;
  assert.equal(splitMessages(glued).length, 2);
  const result = parseManySms(`${paste}\n\nرمز التحقق 1234 لا تشارك`, { now });
  assert.equal(result.parsed.length, 3);
  assert.equal(result.skipped, 1);
});

test("Wallet automation fields", () => {
  const tx = parseWalletTx({ merchant: "Starbucks", amount: "SAR 18.00", card: "Al Rajhi mada" }, { now });
  assert.equal(tx?.amount, 18);
  assert.equal(tx?.currency, "SAR");
  assert.equal(tx?.source, "wallet");
  assert.equal(tx?.categoryId, "food");
  assert.equal(tx?.bank, "alrajhi");
  assert.equal(tx?.date, "2026-11-21");
  assert.equal(parseWalletTx({ merchant: "X", amount: "٤٥٫٥٠ ر.س" }, { now })?.amount, 45.5);
  assert.equal(parseWalletTx({ merchant: "X", amount: "12,50" }, { now })?.amount, 12.5);
  assert.equal(parseWalletTx({ merchant: "X", amount: "USD 5" }, { now })?.sar, null);
  assert.equal(parseWalletTx({ merchant: "X", amount: "" }, { now }), null);
  assert.equal(parseWalletTx({ merchant: "X", amount: "0" }, { now }), null);
});
