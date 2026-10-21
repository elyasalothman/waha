import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSettings } from "@/store/settings-store";
import type { ArabicNews } from "@/lib/arabic-news";
export function HomeNews() {
  const s = useSettings((x) => x.settings);
  const [data, setData] = useState<ArabicNews | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/news", { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!Array.isArray(d.items)) throw new Error();
        setData(d);
        setFailed(d.status === "unavailable");
      })
      .catch(() => {
        if (!ac.signal.aborted) setFailed(true);
      });
    return () => ac.abort();
  }, []);
  const items = (data?.items || [])
    .filter(
      (i) =>
        (!s.newsTopics.length || s.newsTopics.some((topic) => topic === i.topic)) &&
        (!s.newsSources.length || s.newsSources.includes(i.source as never)),
    )
    .slice(0, 3);
  return (
    <section aria-label="آخر الأخبار" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg">آخر الأخبار</h2>
        <Link to="/news" className="min-h-11 content-center text-primary">
          كل الأخبار ←
        </Link>
      </div>
      {items.map((i) => (
        <Link
          to="/news"
          key={i.id}
          className="block min-h-11 border-t border-border py-3 text-sm leading-7"
        >
          {i.title}
          <span className="block text-xs text-muted">
            {i.source} ·{" "}
            {new Intl.DateTimeFormat(s.language, {
              calendar: s.calendar,
              numberingSystem: s.digits,
              dateStyle: "short",
            }).format(new Date(i.publishedAt))}
          </span>
        </Link>
      ))}
      {!items.length && (
        <p className="py-3 text-sm text-muted">
          {failed
            ? "تعذّر تحديث العناوين؛ افتح الأخبار لإعادة المحاولة"
            : data
              ? "لا توجد عناوين في أقسامك المفضلة الآن"
              : "جارٍ تحميل العناوين…"}
        </p>
      )}
      {data?.status === "cached" && <p className="text-xs text-muted">آخر عناوين محفوظة</p>}
    </section>
  );
}
