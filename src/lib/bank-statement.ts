/**
 * Bank statement import (Al Rajhi first): CSV export, or text pasted from the PDF.
 * Parsed on the device. Rows become BankTx with source "statement".
 */
import {
  categorize,
  dayStamp,
  detectBank,
  hashKey,
  merchantKey,
  normalizeText,
  type BankTx,
  type MerchantMap,
  type TxKind,
} from "./bank-sms.ts";

export type StatementResult = { parsed: BankTx[]; skipped: number; format: "csv" | "text" | "unknown" };

// ───────────────────────── CSV ─────────────────────────

export function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      cells.push(cell.trim());
      cell = "";
    } else cell += ch;
  }
  cells.push(cell.trim());
  return cells;
}

/** Splits rows while keeping newlines inside quoted cells. */
function csvRows(text: string): string[] {
  const rows: string[] = [];
  let current = "";
  let quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    if (ch === "\n" && !quoted) {
      rows.push(current);
      current = "";
    } else current += ch;
  }
  if (current) rows.push(current);
  return rows.filter((row) => row.trim());
}

const COLUMN = {
  date: /^(?:التاريخ|تاريخ العملية|تاريخ الحركة|تاريخ القيد|تاريخ المعاملة|date|transaction date|posting date|value date|txn date)$/i,
  description: /^(?:الوصف|البيان|التفاصيل|تفاصيل العملية|وصف العملية|نوع العملية|description|details|narrative|transaction details|particulars|remarks)$/i,
  debit: /^(?:مدين|المدين|سحب|مسحوبات|خصم|debit|debits|withdrawal|withdrawals|money out|debit amount)$/i,
  credit: /^(?:دائن|الدائن|إيداع|ايداع|إيداعات|credit|credits|deposit|deposits|money in|credit amount)$/i,
  amount: /^(?:المبلغ|مبلغ العملية|القيمة|amount|transaction amount)$/i,
  balance: /^(?:الرصيد|رصيد|balance|running balance)$/i,
};

function headerIndex(cells: string[], re: RegExp): number {
  return cells.findIndex((cell) => re.test(cell.replace(/[()]/g, "").replace(/\s*\((?:sar|ر\.س)\)\s*$/i, "").trim()));
}

export function parseMoneyCell(raw: string): number | null {
  if (!raw) return null;
  let text = normalizeText(raw).replace(/SAR|SR|ر\.?\s?س\.?|ريال/gi, "").trim();
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (/^-|-$/.test(text)) negative = true;
  text = text.replace(/[-+\s]/g, "");
  if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(text)) text = text.replace(/\./g, "").replace(",", ".");
  else if (/^\d+,\d{1,2}$/.test(text)) text = text.replace(",", ".");
  else text = text.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const value = Math.round(Number(text) * 100) / 100;
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

export function parseStatementDate(raw: string, now = new Date()): string | null {
  const text = normalizeText(raw);
  const match = text.match(/(\d{1,4})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (!match) {
    const months: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const named = text.match(/(\d{1,2})[\s-]([A-Za-z]{3})[A-Za-z]*[\s-,]*(\d{2,4})/);
    if (!named || !months[named[2].toLowerCase()]) return null;
    const y = Number(named[3]) < 100 ? 2000 + Number(named[3]) : Number(named[3]);
    return stamp(y, months[named[2].toLowerCase()], Number(named[1]), now);
  }
  const [, a, b, c] = match;
  if (a.length === 4) return stamp(Number(a), Number(b), Number(c), now);
  const y = c.length === 4 ? Number(c) : 2000 + Number(c);
  return stamp(y, Number(b), Number(a), now) ?? stamp(y, Number(a), Number(b), now);
}

function stamp(y: number, m: number, d: number, now: Date): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000) return null;
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1) return null;
  if (date > new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)) return null;
  return dayStamp(date);
}

const INCOME_WORDS = /راتب|رواتب|salary|payroll|حوالة واردة|تحويل وارد|واردة|إيداع|ايداع|deposit|incoming|received|credit transfer|استرداد|refund|reversal|مرتجع|cashback|كاش باك/i;

function kindFromDescription(description: string, direction: "income" | "expense"): TxKind {
  if (/راتب|رواتب|salary|payroll/i.test(description)) return "salary";
  if (/استرداد|refund|reversal|مرتجع/i.test(description)) return "refund";
  if (direction === "income") return "transfer_in";
  if (/صراف|سحب نقدي|atm|cash withdrawal/i.test(description)) return "atm";
  if (/سداد|sadad|فاتورة|bill/i.test(description)) return "bill";
  if (/حوالة|حواله|تحويل|transfer/i.test(description)) return "transfer_out";
  if (/انترنت|إنترنت|online|e-?commerce/i.test(description)) return "online";
  return "purchase";
}

/** Merchant from a statement narrative: drop the operation words, card masks and long numbers. */
function narrativeMerchant(description: string): string {
  return normalizeText(description)
    .replace(/[*xX•#]{2,}\s*\d*/g, " ")
    .replace(/\d{5,}/g, " ")
    .replace(/\d{1,4}[-/]\d{1,2}[-/]\d{2,4}/g, " ")
    .replace(/\d{1,2}:\d{2}(:\d{2})?/g, " ")
    .replace(
      /(?<![\p{L}])(?:شراء عبر نقاط البيع|شراء عبر الإنترنت|شراء عبر الانترنت|نقاط البيع|نقاط بيع|شراء|مشتريات|عملية|مدى|mada|apple\s*pay|ابل باي|أبل باي|pos purchase|pos|purchase|e-?commerce|online|internet|debit card|بطاقة|card|حوالة صادرة|حوالة واردة|حوالة محلية|حوالة|تحويل|transfer|سداد فاتورة|سداد|sadad|إيداع|ايداع|deposit|راتب|salary|استرداد|refund|إلى|الى|من|to\b|from\b|-|\|)(?![\p{L}])/giu,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function makeTx(
  date: string,
  description: string,
  signed: number,
  bank: BankTx["bank"],
  occurrence: Map<string, number>,
  learned: MerchantMap,
): BankTx | null {
  const amount = Math.abs(signed);
  if (!(amount > 0) || amount >= 1e9) return null;
  const direction: BankTx["direction"] = signed > 0 ? "income" : "expense";
  const kind = kindFromDescription(description, direction);
  const merchant = narrativeMerchant(description);
  const base = [bank, direction, amount.toFixed(2), date, merchantKey(merchant)].join("|");
  const n = (occurrence.get(base) ?? 0) + 1;
  occurrence.set(base, n);
  const last4 = description.match(/[*xX•]+\s?(\d{4})(?!\d)/)?.[1] ?? null;
  return {
    bank,
    kind,
    direction,
    amount,
    currency: "SAR",
    sar: amount,
    merchant,
    last4,
    date,
    time: null,
    channel: /apple\s*pay|ابل باي|أبل باي/i.test(description) ? "apple_pay" : /مدى|mada/i.test(description) ? "mada" : null,
    categoryId: categorize(merchant, kind, learned),
    source: "statement",
    fingerprint: hashKey(`stmt|${base}|${n}`),
    needsReview: false,
  };
}

export function parseStatementCsv(input: string, options: { now?: Date; learned?: MerchantMap } = {}): StatementResult {
  const text = normalizeText(input.replace(/^\uFEFF/, ""));
  const rows = csvRows(text);
  const now = options.now ?? new Date();
  const learned = options.learned ?? {};
  const bank = detectBank(text.slice(0, 600)) === "unknown" ? "alrajhi" : detectBank(text.slice(0, 600));
  let header: { date: number; description: number; debit: number; credit: number; amount: number; balance: number } | null = null;
  let delimiter = ",";
  const parsed: BankTx[] = [];
  let skipped = 0;
  const occurrence = new Map<string, number>();
  for (const row of rows) {
    if (!header) {
      for (const d of [",", ";", "\t"]) {
        const cells = splitCsvLine(row, d);
        const date = headerIndex(cells, COLUMN.date);
        const description = headerIndex(cells, COLUMN.description);
        const debit = headerIndex(cells, COLUMN.debit);
        const credit = headerIndex(cells, COLUMN.credit);
        const amount = headerIndex(cells, COLUMN.amount);
        if (date >= 0 && (debit >= 0 || credit >= 0 || amount >= 0)) {
          header = { date, description, debit, credit, amount, balance: headerIndex(cells, COLUMN.balance) };
          delimiter = d;
          break;
        }
      }
      continue;
    }
    const cells = splitCsvLine(row, delimiter);
    const date = parseStatementDate(cells[header.date] ?? "", now);
    if (!date) {
      skipped++;
      continue;
    }
    const description = header.description >= 0 ? (cells[header.description] ?? "") : "";
    let signed: number | null = null;
    const debit = header.debit >= 0 ? parseMoneyCell(cells[header.debit] ?? "") : null;
    const credit = header.credit >= 0 ? parseMoneyCell(cells[header.credit] ?? "") : null;
    if (debit && Math.abs(debit) > 0) signed = -Math.abs(debit);
    else if (credit && Math.abs(credit) > 0) signed = Math.abs(credit);
    else if (header.amount >= 0) {
      const amount = parseMoneyCell(cells[header.amount] ?? "");
      if (amount) signed = amount < 0 ? amount : INCOME_WORDS.test(description) ? amount : -amount;
    }
    const tx = signed === null ? null : makeTx(date, description, signed, bank, occurrence, learned);
    if (tx) parsed.push(tx);
    else skipped++;
  }
  return { parsed, skipped, format: header ? "csv" : "unknown" };
}

// ───────────────────────── PDF text paste ─────────────────────────

const LINE_DATE = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/;
const LINE_DATE_ANYWHERE = /(?<!\d)(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})(?!\d)/;
const MONEY_TOKEN = /-?\(?\d{1,3}(?:,\d{3})*\.\d{2}\)?-?|-?\(?\d+\.\d{2}\)?-?/g;

/**
 * One transaction per line that carries a date and money columns, as PDF text usually pastes.
 * With two or more amounts, the last is the running balance; its change decides the direction.
 */
export function parseStatementText(input: string, options: { now?: Date; learned?: MerchantMap } = {}): StatementResult {
  const text = normalizeText(input);
  const now = options.now ?? new Date();
  const learned = options.learned ?? {};
  const detected = detectBank(text.slice(0, 600));
  const bank = detected === "unknown" ? "alrajhi" : detected;
  const parsed: BankTx[] = [];
  let skipped = 0;
  let previousBalance: number | null = null;
  const occurrence = new Map<string, number>();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const dateMatch = line.match(LINE_DATE) ?? line.match(LINE_DATE_ANYWHERE);
    if (!dateMatch) continue;
    const date = parseStatementDate(dateMatch[1], now);
    const rest = line.replace(dateMatch[1], " ");
    const amounts = [...rest.matchAll(MONEY_TOKEN)].map((m) => parseMoneyCell(m[0])).filter((n): n is number => n !== null);
    if (!date || !amounts.length) {
      skipped++;
      continue;
    }
    const description = rest.replace(MONEY_TOKEN, " ").replace(/\s+/g, " ").trim();
    let signed: number;
    if (amounts.length >= 2) {
      const balance = amounts[amounts.length - 1];
      const amount = amounts[amounts.length - 2];
      if (amount < 0) signed = amount;
      else if (previousBalance !== null && Math.abs(previousBalance + amount - balance) < 0.011) signed = amount;
      else if (previousBalance !== null && Math.abs(previousBalance - amount - balance) < 0.011) signed = -amount;
      else signed = INCOME_WORDS.test(description) ? amount : -amount;
      previousBalance = balance;
    } else {
      const amount = amounts[0];
      signed = amount < 0 ? amount : INCOME_WORDS.test(description) ? amount : -amount;
    }
    const tx = makeTx(date, description, signed, bank, occurrence, learned);
    if (tx) parsed.push(tx);
    else skipped++;
  }
  return { parsed, skipped, format: parsed.length ? "text" : "unknown" };
}

/** Picks CSV when a header row is found, else the PDF-text reading. */
export function parseStatement(input: string, options: { now?: Date; learned?: MerchantMap } = {}): StatementResult {
  const csv = parseStatementCsv(input, options);
  if (csv.format === "csv" && csv.parsed.length) return csv;
  const textResult = parseStatementText(input, options);
  if (textResult.parsed.length) return textResult;
  return csv.format === "csv" ? csv : textResult;
}
