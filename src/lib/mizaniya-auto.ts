/**
 * Automatic recording for ميزانيتي: bank SMS, Wallet and statements → ledger entries.
 * Everything stays in this device's storage. Raw message text is never stored.
 */
import { merchantKey, learnMerchant, parseManySms, parseWalletTx, type BankTx, type MerchantMap } from "./bank-sms.ts";
import type { AccountId, CategoryId, Entry, Ledger } from "./mizaniya.ts";

export const MERCHANT_MAP_KEY = "waha:mizaniya:merchants:v1";

const KIND_AR: Record<BankTx["kind"], string> = {
  purchase: "شراء",
  online: "شراء إلكتروني",
  atm: "سحب صراف",
  bill: "سداد فاتورة",
  transfer_out: "حوالة صادرة",
  transfer_in: "حوالة واردة",
  salary: "راتب",
  refund: "استرداد",
};

export function kindLabel(kind: BankTx["kind"]): string {
  return KIND_AR[kind];
}

function tokens(name: string): string[] {
  return merchantKey(name)
    .split(" ")
    .filter((token) => token.length >= 3);
}

export function sameMerchant(a: string, b: string): boolean {
  const ka = merchantKey(a);
  const kb = merchantKey(b);
  if (!ka || !kb) return true;
  if (ka.includes(kb) || kb.includes(ka)) return true;
  const tb = new Set(tokens(b));
  return tokens(a).some((token) => tb.has(token));
}

/** True when the ledger already holds this bank transaction, from this source or another. */
export function isDuplicate(entries: readonly Entry[], tx: BankTx): boolean {
  const amount = tx.sar ?? tx.amount;
  return entries.some((entry) => {
    if (entry.ref && entry.ref === tx.fingerprint) return true;
    if (!entry.source || entry.source === tx.source) return false;
    return (
      entry.on === tx.date &&
      entry.kind === tx.direction &&
      Math.abs(entry.amount - amount) < 0.005 &&
      sameMerchant(entry.merchant ?? entry.note, tx.merchant)
    );
  });
}

export function txToEntry(tx: BankTx, account: AccountId): Entry | null {
  if (tx.sar === null || !(tx.sar > 0)) return null;
  const label = KIND_AR[tx.kind];
  const note = tx.merchant ? (tx.kind === "purchase" || tx.kind === "online" ? tx.merchant : `${label}: ${tx.merchant}`) : label;
  const entry: Entry = {
    id: `auto:${tx.fingerprint}`,
    account,
    kind: tx.direction,
    amount: tx.sar,
    categoryId: tx.direction === "income" ? "income" : tx.categoryId,
    note: note.slice(0, 140),
    on: tx.date,
    source: tx.source,
    ref: tx.fingerprint,
  };
  if (tx.merchant) entry.merchant = tx.merchant;
  if (tx.last4) entry.last4 = tx.last4;
  return entry;
}

export type MergeResult = {
  ledger: Ledger;
  added: Entry[];
  duplicates: number;
  /** Foreign-currency items with no SAR amount: shown to the user, not booked. */
  review: BankTx[];
};

export function mergeTransactions(ledger: Ledger, txs: readonly BankTx[], account: AccountId = "personal"): MergeResult {
  const added: Entry[] = [];
  const review: BankTx[] = [];
  let duplicates = 0;
  for (const tx of txs) {
    if (isDuplicate([...added, ...ledger.entries], tx)) {
      duplicates++;
      continue;
    }
    const entry = txToEntry(tx, account);
    if (!entry) {
      review.push(tx);
      continue;
    }
    added.push(entry);
  }
  return {
    ledger: added.length ? { ...ledger, entries: [...added, ...ledger.entries] } : ledger,
    added,
    duplicates,
    review,
  };
}

/** Changes one entry's category, learns the merchant, and moves its other auto entries too. */
export function recategorize(
  ledger: Ledger,
  map: MerchantMap,
  entryId: string,
  categoryId: CategoryId,
): { ledger: Ledger; map: MerchantMap } {
  const target = ledger.entries.find((entry) => entry.id === entryId);
  if (!target || target.kind !== "expense" || categoryId === "income") return { ledger, map };
  const name = target.merchant ?? "";
  const key = name ? merchantKey(name) : "";
  const entries = ledger.entries.map((entry) => {
    if (entry.id === entryId) return { ...entry, categoryId };
    if (key && entry.source && entry.kind === "expense" && entry.merchant && merchantKey(entry.merchant) === key)
      return { ...entry, categoryId };
    return entry;
  });
  return { ledger: { ...ledger, entries }, map: name ? learnMerchant(map, name, categoryId) : map };
}

export type Intake = {
  sms: string[];
  sender: string | null;
  wallet: { merchant: string; amount: string; card: string } | null;
};

/** Reads ?sms=… or #sms=… (the hash never reaches the server), plus Wallet fields. */
export function readIntake(search: string, hash: string): Intake {
  const sms: string[] = [];
  let sender: string | null = null;
  let merchant = "";
  let amount = "";
  let card = "";
  for (const raw of [search, hash]) {
    const text = (raw ?? "").replace(/^[?#]/, "");
    if (!text) continue;
    let params: URLSearchParams;
    try {
      params = new URLSearchParams(text);
    } catch {
      continue;
    }
    for (const value of params.getAll("sms")) if (value.trim()) sms.push(value.slice(0, 4000));
    sender = params.get("sender")?.slice(0, 60) ?? sender;
    merchant = params.get("merchant")?.slice(0, 120) ?? merchant;
    amount = params.get("amount")?.slice(0, 60) ?? amount;
    card = params.get("card")?.slice(0, 60) ?? card;
  }
  return { sms: sms.slice(0, 50), sender, wallet: amount ? { merchant, amount, card } : null };
}

export function intakeTransactions(intake: Intake, learned: MerchantMap, now = new Date()): { parsed: BankTx[]; skipped: number } {
  const parsed: BankTx[] = [];
  let skipped = 0;
  for (const message of intake.sms) {
    const result = parseManySms(message, { sender: intake.sender, learned, now });
    parsed.push(...result.parsed);
    skipped += result.skipped;
  }
  if (intake.wallet) {
    const tx = parseWalletTx(intake.wallet, { learned, now, sender: intake.sender });
    if (tx) parsed.push(tx);
    else skipped++;
  }
  return { parsed, skipped };
}

export function hasIntake(intake: Intake): boolean {
  return intake.sms.length > 0 || intake.wallet !== null;
}
