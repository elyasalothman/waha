import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseManySms, parseMerchantMap, type BankTx, type MerchantMap } from "@/lib/bank-sms";
import { parseStatement } from "@/lib/bank-statement";
import { CATEGORIES, CURRENCY, type AccountId, type CategoryId, type Ledger } from "@/lib/mizaniya";
import { MERCHANT_MAP_KEY, hasIntake, intakeTransactions, mergeTransactions, readIntake, recategorize } from "@/lib/mizaniya-auto";
import { usePersistent } from "@/lib/storage";

const CATEGORY_IDS = CATEGORIES.map((item) => item.id) as readonly string[];
const WEB_BASE = "https://waha.hajdah.com/app/budget";
const APP_BASE = "waha://app/budget";

type Props = {
  ledger: Ledger;
  onLedger: (next: Ledger) => void;
  account: AccountId;
  ready: boolean;
  lang: "ar" | "en";
};

function fmt(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${CURRENCY}`;
}

/** Bank SMS, Wallet and statements → ledger, parsed on this device. */
export function BudgetAuto({ ledger, onLedger, account, ready, lang }: Props) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const [rawMap, setMap, mapReady] = usePersistent<MerchantMap>(MERCHANT_MAP_KEY, {});
  const map = useMemo(() => parseMerchantMap(JSON.stringify(rawMap ?? {}), CATEGORY_IDS), [rawMap]);
  const [paste, setPaste] = useState("");
  const [statement, setStatement] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [review, setReview] = useState<BankTx[]>([]);
  const [guide, setGuide] = useState(false);
  const handled = useRef(false);

  function apply(parsed: BankTx[], skipped: number, base = ledger) {
    const result = mergeTransactions(base, parsed, account);
    if (result.added.length) onLedger(result.ledger);
    setReview(result.review);
    const parts = [
      L(`سُجّلت ${result.added.length}`, `Recorded ${result.added.length}`),
      result.duplicates ? L(`مكررة ${result.duplicates}`, `Duplicates ${result.duplicates}`) : "",
      result.review.length ? L(`بعملة أجنبية تحتاج مراجعة ${result.review.length}`, `Foreign, needs review ${result.review.length}`) : "",
      skipped ? L(`لم تُفهم ${skipped}`, `Not understood ${skipped}`) : "",
    ].filter(Boolean);
    const last = result.added[0];
    const lastLine = last ? ` · ${last.note} ${fmt(last.amount)}` : "";
    setNotice(`${parts.join(" · ")}${lastLine}`);
    return result;
  }

  const latest = useRef({ ledger, map });
  latest.current = { ledger, map };

  useEffect(() => {
    if (!ready || !mapReady) return;
    const take = () => {
      const { search, hash, pathname } = window.location;
      if (/guide/.test(hash)) setGuide(true);
      const intake = readIntake(search, hash);
      if (!hasIntake(intake)) return;
      const { parsed, skipped } = intakeTransactions(intake, latest.current.map);
      const result = apply(parsed, skipped, latest.current.ledger);
      latest.current = { ...latest.current, ledger: result.ledger };
      if (!parsed.length && intake.sms.length) setPaste(intake.sms.join("\n\n"));
      // The message leaves the address bar and the history at once.
      window.history.replaceState(window.history.state, "", pathname);
    };
    if (!handled.current) {
      handled.current = true;
      take();
    }
    // A second link while this page is open only changes the fragment.
    window.addEventListener("hashchange", take);
    return () => window.removeEventListener("hashchange", take);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mapReady]);

  function importPaste() {
    const { parsed, skipped } = parseManySms(paste, { learned: map });
    apply(parsed, skipped);
    setPaste("");
  }

  function importStatement(text: string) {
    const result = parseStatement(text, { learned: map });
    if (!result.parsed.length) {
      setNotice(L("لم نجد حركات في الكشف. تأكد أن فيه أعمدة التاريخ والمبلغ.", "No rows found. The statement needs date and amount columns."));
      return;
    }
    apply(result.parsed, result.skipped);
    setStatement("");
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5_000_000) {
      setNotice(L("الملف كبير جدًا.", "The file is too large."));
      return;
    }
    void file.text().then(importStatement);
  }

  function changeCategory(entryId: string, categoryId: CategoryId) {
    const result = recategorize(ledger, map, entryId, categoryId);
    onLedger(result.ledger);
    setMap(result.map);
  }

  const recent = ledger.entries
    .filter((entry) => entry.source && entry.account === account)
    .sort((a, b) => b.on.localeCompare(a.on))
    .slice(0, 8);

  return (
    <section className="waha-card tint-sky space-y-3" aria-label={L("تسجيل تلقائي", "Automatic recording")} data-testid="budget-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg">{L("تسجيل تلقائي من رسائل البنك", "Automatic recording from bank SMS")}</h2>
          <p className="text-sm leading-7 text-muted">
            {L(
              "تُحلَّل الرسالة على هذا الجهاز فقط، ولا يُحفظ نصها، ولا نحفظ من البطاقة إلا آخر 4 أرقام. بلا ربط بنكي.",
              "Messages are read on this device only. The text is not kept, and only the card's last 4 digits are saved. No bank login.",
            )}
          </p>
        </div>
        <Button type="button" variant="outline" className="shrink-0 whitespace-nowrap" onClick={() => setGuide((value) => !value)} data-testid="budget-auto-guide-toggle">
          {guide ? L("إخفاء الطريقة", "Hide guide") : L("طريقة الإعداد", "Setup guide")}
        </Button>
      </div>

      {notice ? (
        <p className="rounded-xl border border-border bg-surface px-3 py-2 text-sm" role="status" data-testid="budget-auto-notice">
          {notice}
        </p>
      ) : null}

      {guide ? <SetupGuide /> : null}

      <label className="block text-sm" htmlFor="budget-sms">
        {L("الصق رسالة أو عدة رسائل من البنك", "Paste one or more bank messages")}
      </label>
      <textarea
        id="budget-sms"
        className="min-h-28 w-full rounded-xl border border-border bg-surface p-3 text-sm"
        value={paste}
        onChange={(event) => setPaste(event.target.value)}
        placeholder={L("مثال: شراء عبر نقاط البيع… مبلغ: SAR 45.50… لدى: …", "e.g. POS Purchase… Amount: SAR 45.50… At: …")}
        dir="auto"
      />
      <Button type="button" className="min-h-11 w-full" disabled={!paste.trim()} onClick={importPaste}>
        {L("حلّل وسجّل", "Read and record")}
      </Button>

      <details className="rounded-xl border border-border p-3">
        <summary className="cursor-pointer text-sm">{L("استيراد كشف حساب (CSV أو نص PDF)", "Import a statement (CSV or PDF text)")}</summary>
        <div className="mt-3 space-y-2">
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            aria-label={L("ملف CSV", "CSV file")}
            onChange={(event) => onFile(event.target.files?.[0])}
            className="block w-full text-sm"
          />
          <textarea
            className="min-h-24 w-full rounded-xl border border-border bg-surface p-3 text-sm"
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            placeholder={L("أو انسخ نص الكشف من ملف PDF والصقه هنا", "Or copy the statement text from the PDF and paste it here")}
            dir="auto"
          />
          <Button type="button" variant="outline" disabled={!statement.trim()} onClick={() => importStatement(statement)}>
            {L("استيراد الكشف", "Import statement")}
          </Button>
          <p className="text-xs leading-6 text-muted">
            {L("الحركات المكررة مع الرسائل أو مع استيراد سابق لا تُسجَّل مرتين.", "Rows already recorded from SMS or an earlier import are skipped.")}
          </p>
        </div>
      </details>

      {review.length ? (
        <div className="space-y-1 text-sm" data-testid="budget-auto-review">
          <p>{L("عمليات بعملة أجنبية بلا مبلغ بالريال، أضفها يدويًا بالمبلغ الذي خُصم:", "Foreign purchases with no SAR amount. Add them by hand:")}</p>
          <ul className="list-disc ps-5">
            {review.map((tx) => (
              <li key={tx.fingerprint}>
                {tx.merchant || tx.kind} · {tx.amount} {tx.currency} · {tx.date}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {recent.length ? (
        <div>
          <h3 className="text-sm text-muted">{L("آخر ما سُجّل تلقائيًا · غيّر التصنيف ويتذكره التطبيق للتاجر", "Latest automatic entries · change a category and it is remembered")}</h3>
          <ul className="mt-2 space-y-2">
            {recent.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{entry.note}</span>
                  <span className="block text-xs text-muted" dir="ltr">
                    {entry.on}
                    {entry.last4 ? ` · ${entry.last4}` : ""}
                  </span>
                </span>
                <span className="tabular-nums">
                  {entry.kind === "income" ? "+" : "−"}
                  {fmt(entry.amount)}
                </span>
                {entry.kind === "expense" ? (
                  <select
                    className="min-h-11 rounded-xl border border-border bg-surface px-2"
                    value={entry.categoryId}
                    aria-label={L("التصنيف", "Category")}
                    onChange={(event) => changeCategory(entry.id, event.target.value as CategoryId)}
                  >
                    {CATEGORIES.filter((item) => item.id !== "income").map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.emoji} {lang === "ar" ? item.ar : item.en}
                      </option>
                    ))}
                  </select>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CopyLine({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-surface px-2 py-1 text-xs" dir="ltr">
        {text}
      </code>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => setDone(true));
        }}
      >
        {done ? "نُسخ" : "نسخ"}
      </Button>
    </div>
  );
}

/** Arabic, step by step. Shown inside ميزانيتي. */
export function SetupGuide() {
  return (
    <div className="space-y-4 rounded-xl border border-border p-3 text-sm leading-7" dir="rtl" data-testid="budget-auto-setup">
      <div>
        <h3 className="text-base">آيفون: تسجيل كل رسالة من البنك تلقائيًا (iOS 17 أو أحدث)</h3>
        <ol className="list-decimal space-y-1 ps-5">
          <li>افتح تطبيق «الاختصارات» Shortcuts، ثم تبويب «الأتمتة» Automation، ثم زر «+».</li>
          <li>اختر «رسالة» Message.</li>
          <li>في «المرسل» Sender اكتب اسم البنك كما يظهر في الرسائل، مثل AlRajhiBank.</li>
          <li>في «الرسالة تحتوي» Message Contains اكتب SAR (أو «مبلغ») حتى تُتجاهل رسائل الرموز والإعلانات.</li>
          <li>اختر «تشغيل فورًا» Run Immediately، ثم «التالي» ثم «أتمتة فارغة جديدة» New Blank Automation.</li>
          <li>أضف إجراء «ترميز URL» URL Encode، واجعل مدخله «مُدخل الاختصار» Shortcut Input، ثم اضغط عليه واختر «المحتوى» Content.</li>
          <li>أضف إجراء «نص» Text والصق فيه الرابط التالي، ثم ضع بعده مباشرة المتغير «نص URL المرمّز» URL Encoded Text:</li>
        </ol>
        <CopyLine text={`${APP_BASE}#sender=AlRajhiBank&sms=`} />
        <p className="text-xs text-muted">
          هذا الرابط يفتح تطبيق واحة. إذا كنت تستخدم واحة من Safari، أو كان إصدار التطبيق عندك أقدم من دعم الروابط، استخدم هذا بدلًا منه:
        </p>
        <CopyLine text={`${WEB_BASE}#sender=AlRajhiBank&sms=`} />
        <ol className="list-decimal space-y-1 ps-5" start={8}>
          <li>أضف إجراء «فتح عناوين URL» Open URLs واجعل مدخله «النص» Text.</li>
          <li>اضغط «تم». كرر الخطوات لكل بنك عندك، وغيّر اسم المرسل في الرابط.</li>
        </ol>
        <p className="text-xs text-muted">
          عند وصول رسالة يفتح الاختصار واحة لحظة ويسجّل العملية. النص بعد علامة # لا يُرسل إلى أي خادم، ويُمسح من شريط العنوان بعد التسجيل. البيانات تُحفظ في المكان الذي فُتح فيه الرابط: التطبيق أو Safari.
        </p>
      </div>

      <div>
        <h3 className="text-base">آيفون: مشتريات Apple Pay من المحفظة</h3>
        <ol className="list-decimal space-y-1 ps-5">
          <li>في «الأتمتة» اضغط «+» واختر «معاملة» Transaction، ثم اختر بطاقاتك، و«تشغيل فورًا».</li>
          <li>أضف «ترميز URL» لـ«التاجر» Merchant من مُدخل الاختصار، ثم «ترميز URL» ثانيًا لـ«المبلغ» Amount.</li>
          <li>أضف «نص» بهذا الشكل، وضع متغير التاجر المرمّز مكان MERCHANT، ومتغير المبلغ المرمّز مكان AMOUNT:</li>
        </ol>
        <CopyLine text={`${APP_BASE}#merchant=MERCHANT&amount=AMOUNT`} />
        <ol className="list-decimal space-y-1 ps-5" start={4}>
          <li>أضف «فتح عناوين URL» على النص. إذا وصلت رسالة البنك للعملية نفسها فلن تُسجَّل مرتين.</li>
        </ol>
      </div>

      <div>
        <h3 className="text-base">أندرويد</h3>
        <p>
          لا يقرأ واحة رسائلك بنفسه. يمكنك استعمال تطبيق أتمتة مثل Tasker أو MacroDroid: عند وصول رسالة من البنك افتح الرابط
          نفسه بعد إضافة نص الرسالة مرمّزًا. أو انسخ الرسالة والصقها في الخانة أعلاه.
        </p>
        <CopyLine text={`${APP_BASE}#sms=`} />
      </div>

      <div>
        <h3 className="text-base">كشف الحساب</h3>
        <p>
          من تطبيق الراجحي نزّل كشف الحساب بصيغة CSV أو Excel (احفظه CSV)، ثم اختره في «استيراد كشف حساب». ولكشف PDF افتح الملف،
          انسخ النص كله، والصقه في الخانة نفسها.
        </p>
      </div>
    </div>
  );
}
