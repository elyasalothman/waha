import { useEffect, useState } from "react";
import { ExternalLink, Plus, X } from "lucide-react";
import { parseWatchlist, WATCHLIST_KEY } from "@/lib/watchlist";
import type { Lang } from "@/lib/i18n";

export function CompanyWatchlist({ lang }: { lang: Lang }) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const [companies, setCompanies] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const shownCompanies = expanded ? companies : companies.slice(0, 3);
  useEffect(() => {
    try {
      setCompanies(parseWatchlist(localStorage.getItem(WATCHLIST_KEY)));
    } catch {
      setSaved(false);
    }
    setReady(true);
  }, []);
  function update(next: string[]) {
    setCompanies(next);
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }
  return (
    <section
      aria-labelledby="home-watchlist-title"
      data-home-section="watchlist"
      className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <h2 id="home-watchlist-title" className="text-base font-semibold">
        {L("الشركات التي تتابعها", "Companies you follow")}
      </h2>
      <p className="mt-2 text-xs text-muted">
        {L(
          "قائمة على جهازك فقط · بلا أسعار أو تنبيهات",
          "On this device only · No prices or alerts",
        )}
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = name.trim();
          if (!ready || !value || companies.includes(value) || companies.length >= 20) return;
          update([...companies, value]);
          setName("");
        }}
      >
        <label className="sr-only" htmlFor="watch-company">
          {L("اسم الشركة أو رمزها", "Company name or symbol")}
        </label>
        <input
          id="watch-company"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          disabled={!ready || companies.length >= 20}
          placeholder={L("اسم الشركة أو رمزها", "Company name or symbol")}
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-sm"
        />
        <button
          type="submit"
          disabled={
            !ready || !name.trim() || companies.includes(name.trim()) || companies.length >= 20
          }
          className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-primary px-3 text-sm text-primary-fg disabled:opacity-40"
        >
          <Plus className="size-4" />
          {L("أضف", "Add")}
        </button>
      </form>
      {companies.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {shownCompanies.map((company) => (
            <li
              key={company}
              className="flex max-w-full items-center gap-1 rounded-full border border-border bg-surface-2 ps-3 text-sm"
            >
              <span className="truncate">{company}</span>
              <button
                type="button"
                className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-border"
                aria-label={`${L("إزالة", "Remove")} ${company}`}
                onClick={() => update(companies.filter((item) => item !== company))}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted">
          {L(
            "أضف شركة لتبدأ قائمتك. لا نطلب بيانات محفظتك.",
            "Add a company to start. No portfolio information is needed.",
          )}
        </p>
      )}
      {companies.length > 3 ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 min-h-11 text-xs font-medium text-primary hover:underline"
        >
          {expanded
            ? L("عرض أقل", "Show less")
            : L(`عرض الكل (${companies.length})`, `Show all (${companies.length})`)}
        </button>
      ) : null}
      {!saved ? (
        <p className="mt-2 text-sm text-danger" role="status">
          {L(
            "تعذّر الحفظ على الجهاز. ستفقد هذه التغييرات عند إغلاق الصفحة.",
            "Device storage is unavailable. These changes will be lost when the page closes.",
          )}
        </p>
      ) : null}
      {companies.length >= 20 ? (
        <p className="mt-2 text-xs text-muted">
          {L("وصلت للحد: 20 شركة.", "Limit reached: 20 companies.")}
        </p>
      ) : null}
      <div
        className="mt-3 flex flex-wrap items-center gap-x-4 border-t border-border pt-1"
        aria-label={L("المصادر الرسمية", "Official sources")}
      >
        <a
          href="https://www.saudiexchange.sa/wps/portal/saudiexchange/about-saudi-exchange/exchange-media-centre?locale=en"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-xs text-primary hover:underline"
        >
          {L("تداول السعودية", "Saudi Exchange")}
          <ExternalLink className="size-3" />
        </a>
        <a
          href="https://cma.gov.sa/MediaCenter/NEWS/Pages/default.aspx"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-xs text-primary hover:underline"
        >
          {L("هيئة السوق المالية", "CMA")}
          <ExternalLink className="size-3" />
        </a>
        <a
          href="https://www.sama.gov.sa/ar-sa/MediaCenter/News/pages/allnews.aspx"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-xs text-primary hover:underline"
        >
          {L("البنك المركزي", "Central Bank")}
          <ExternalLink className="size-3" />
        </a>
      </div>
    </section>
  );
}
