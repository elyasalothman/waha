import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { findServices } from "@/lib/superapp";
import { useAppStore } from "@/store/app-store";
import { hideMoney, isMoneySurface } from "@/lib/child-mode";
export function SearchApp() {
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<{ title: string; url: string }[]>([]);
  const [status, setStatus] = useState("");
  const segment = useAppStore((s) => s.segment);
  useEffect(() => {
    if (!term) return;
    const ac = new AbortController();
    setStatus("جارٍ البحث في ويكيبيديا العربية…");
    setResults([]);
    fetch(
      `https://ar.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=8&namespace=0&format=json&origin=*`,
      { signal: ac.signal },
    )
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (ac.signal.aborted) return;
        const rows = (data[1] as string[])
          .map((title, i) => ({ title, url: data[3][i] as string }))
          .filter((r) => r.url.startsWith("https://ar.wikipedia.org/"));
        setResults(rows);
        setStatus(
          rows.length ? "نتائج الويب · ويكيبيديا العربية" : "لا توجد نتائج ويب لهذا البحث.",
        );
      })
      .catch(() => {
        if (!ac.signal.aborted) setStatus("تعذر بحث الويب. نتائج واحة المحلية متاحة دون اتصال.");
      });
    return () => ac.abort();
  }, [term]);
  const local = findServices(query).filter((s) => !hideMoney(segment) || !isMoneySurface(s));
  return (
    <div className="space-y-4" dir="rtl">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(query.trim());
        }}
      >
        <input
          aria-label="بحث واحة"
          placeholder="ابحث في واحة والويب"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-surface p-3"
          maxLength={160}
        />
        <button className="min-h-12 rounded-xl bg-primary px-4 text-primary-fg">بحث</button>
      </form>
      <h2 className="font-display text-xl">من منظومة واحة</h2>
      <p className="text-xs text-muted">
        بحث في فهرس الخدمات وأوصاف المحتوى؛ يشمل حصتي والألعاب والكتب والأخبار والمواقع.
      </p>
      <div className="space-y-2">
        {local.slice(0, 20).map((s) => (
          <Link
            key={s.id}
            to={s.href}
            className="block rounded-xl border border-border bg-surface p-3"
          >
            <strong>{s.title.ar}</strong>
            <p className="mt-1 text-sm text-muted">{s.blurb.ar}</p>
          </Link>
        ))}
        {!local.length && <p>لا توجد نتائج محلية.</p>}
      </div>
      <p role="status">{status}</p>
      {results.map((r) => (
        <Link
          key={r.url}
          to="/app/$id"
          params={{ id: "browser" }}
          onClick={() => {
            sessionStorage.setItem("waha:browser:pending", r.url);
          }}
          className="block rounded-xl border border-border p-3"
        >
          {r.title} ←
          <span className="block text-xs text-muted">ويكيبيديا · افتح في متصفح واحة</span>
        </Link>
      ))}
    </div>
  );
}
