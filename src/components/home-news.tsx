import { useEffect, useState } from "react";
import { fetchHomeNews, type NewsItem } from "@/lib/news";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

/** Isolated: failure or empty feed renders nothing. Never blanks «ظل اليوم». */
export function HomeNews() {
  const lang = useAppStore((s) => s.lang);
  const [items, setItems] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    let live = true;
    fetchHomeNews()
      .then((rows) => {
        if (live) setItems(rows);
      })
      .catch(() => {
        if (live) setItems([]);
      });
    return () => {
      live = false;
    };
  }, []);

  if (!items?.length) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "news")}</h2>
      <div className="grid gap-2">
        {items.map((item) => (
          <p key={item.id} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            {item.title}
          </p>
        ))}
      </div>
    </section>
  );
}
