import { useState } from "react";
import { DESK_DAILY_CAP, deskAllowed, deskDay, figuresPdf, pricesToCsv } from "@/lib/mohsen-desk";

const KEY = "waha:mohsen-desk:v1";

type Page = { url: string; title: string; excerpt: string; prices: { amount: string; unit: string; context: string }[] };

function loadQuota() {
  const day = deskDay();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as { day?: string; count?: number; device?: string };
    const device = typeof raw.device === "string" && raw.device ? raw.device : crypto.randomUUID();
    const count = raw.day === day && Number.isInteger(raw.count) ? Number(raw.count) : 0;
    localStorage.setItem(KEY, JSON.stringify({ day, count, device }));
    return { day, count, device };
  } catch {
    return { day, count: DESK_DAILY_CAP, device: "" };
  }
}

function saveQuota(device: string, count: number) {
  localStorage.setItem(KEY, JSON.stringify({ day: deskDay(), count, device }));
}

export function MohsenDesk() {
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [pages, setPages] = useState<Page[] | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [left, setLeft] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    const quota = loadQuota();
    if (!deskAllowed(quota.count) || !quota.device) {
      setError("وصلت حد اليوم. حاول غدًا.");
      setLeft(0);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/mohsen-desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: [first, second].map((item) => item.trim()).filter(Boolean),
          device: quota.device,
          count: quota.count,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "تعذّر تنفيذ المهمة.");
        if (response.status === 429) setLeft(0);
        return;
      }
      const next = quota.count + 1;
      saveQuota(quota.device, next);
      setLeft(DESK_DAILY_CAP - next);
      setPages(data.pages);
      setNote(typeof data.note === "string" ? data.note : "");
    } catch {
      setError("تعذّر الاتصال. ما فيه نتيجة بديلة.");
    } finally {
      setBusy(false);
    }
  }

  function download(name: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mb-3 rounded-2xl border border-border bg-surface p-3" aria-label="مكتب محسن للصفحات العامة">
      <p className="text-sm leading-7">
        يفتح صفحات https عامة فقط. لا يدخل حسابًا، ولا يدفع، ولا يرسل رسالة. إن لم يُطبع سعر، يقول ذلك.
      </p>
      <label className="mt-2 block text-xs text-muted">
        الرابط الأول
        <input value={first} onChange={(event) => setFirst(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-bg px-3" dir="ltr" />
      </label>
      <label className="mt-2 block text-xs text-muted">
        رابط ثانٍ للمقارنة، إن أردت
        <input value={second} onChange={(event) => setSecond(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-bg px-3" dir="ltr" />
      </label>
      <button type="button" className="mt-2 min-h-11 rounded-xl bg-primary px-4 text-primary-fg" disabled={busy} onClick={() => void run()}>
        {busy ? "يفتح الصفحة…" : "اقرأ أو قارن"}
      </button>
      {left !== null ? <p className="mt-2 text-xs text-muted">المتبقي اليوم على هذا الجهاز: {left} من {DESK_DAILY_CAP}</p> : null}
      {error ? <p role="alert" className="mt-2 text-sm">{error}</p> : null}
      {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
      {pages?.map((page) => (
        <article key={page.url} className="mt-3 text-sm leading-7">
          <a href={page.url} className="text-primary underline" dir="ltr">{page.url}</a>
          <p className="font-medium">{page.title || "بلا عنوان"}</p>
          <p>{page.excerpt || "الصفحة بلا نص مقروء."}</p>
          <p>{page.prices.length ? page.prices.map((price) => `${price.amount} ${price.unit}`).join(" · ") : "لا سعر مطبوع في الصفحة."}</p>
        </article>
      ))}
      {pages ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl border border-border px-3"
            onClick={() => download("mohsen-desk.csv", new Blob([pricesToCsv(pages)], { type: "text/csv;charset=utf-8" }))}
          >
            CSV
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl border border-border px-3"
            onClick={() => download("mohsen-desk.pdf", new Blob([figuresPdf(pages)], { type: "application/pdf" }))}
          >
            PDF
          </button>
        </div>
      ) : null}
    </section>
  );
}
