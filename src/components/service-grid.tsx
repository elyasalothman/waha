import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { findServices, HOME_SERVICE_IDS } from "@/lib/superapp";
import { appIcon } from "@/lib/icons";
import { useAppStore } from "@/store/app-store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { hideMoney, isMoneySurface } from "@/lib/child-mode";

export function ServiceGrid({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [pillar, setPillar] = useState("all");
  const lang = useAppStore((s) => s.lang);
  const segment = useAppStore((s) => s.segment);
  const pushRecent = useAppStore((s) => s.pushRecent);
  const { user } = useCurrentUserState();
  const items = findServices(query, pillar).filter(
    (s) => !hideMoney(segment) || !isMoneySurface(s),
  );
  const shown =
    compact && !query.trim()
      ? HOME_SERVICE_IDS.map((id) => items.find((s) => s.id === id)).filter((s) => s != null)
      : items;
  return (
    <section className="space-y-4" aria-label={lang === "ar" ? "خدمات واحة" : "Waha services"}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">
          {lang === "ar" ? "كل عالمك، في واحة" : "Your world, in Waha"}
        </h2>
        {compact && (
          <Link to="/more" className="min-h-11 content-center text-sm text-primary">
            {lang === "ar" ? "كل الخدمات" : "All services"}
          </Link>
        )}
      </div>
      <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-surface px-4">
        <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <span className="sr-only">
          {lang === "ar" ? "ابحث عن خدمة أو محتوى" : "Search services and content"}
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "ar" ? "حصتي، وردك، كتاب، لعبة…" : "Hissati, Quran, books, games…"}
          className="min-h-14 w-full min-w-0 bg-transparent outline-none"
        />
      </label>
      {!compact && user && !user.isDevFallback && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="الأركان الأربعة">
          {[
            ["all", "الكل"],
            ["faith", "ديني"],
            ["news", "أخبار"],
            ["fun", "ممتع"],
            ["learn", "تعلّم"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={pillar === id}
              onClick={() => setPillar(id)}
              className={`min-h-11 rounded-full border border-border px-4 ${pillar === id ? "bg-primary text-primary-fg" : "bg-surface"}`}
            >
              {lang === "ar" ? label : id}
            </button>
          ))}
        </div>
      )}
      {query && (
        <p role="status" className="text-sm text-muted">
          {shown.length} {lang === "ar" ? "نتيجة" : "results"}
        </p>
      )}
      <div
        className={`grid gap-3 ${compact ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}
      >
        {shown.map((s) => {
          const Icon = appIcon(s.icon);
          return (
            <Link
              to={s.href}
              key={s.id}
              onClick={() => pushRecent(s.id)}
              className="group flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-center hover:bg-surface-2"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-surface-2 text-primary">
                <Icon className="size-5" strokeWidth={1.7} />
              </span>
              <span className="text-sm font-medium leading-6">{s.title[lang]}</span>
              {!compact && <span className="text-xs leading-6 text-muted">{s.blurb[lang]}</span>}
            </Link>
          );
        })}
      </div>
      {!shown.length && (
        <p className="rounded-xl border border-border p-5 text-muted">
          {lang === "ar"
            ? "لم نجد نتيجة. جرّب اسم الخدمة أو اسأل محسن."
            : "No results. Try another name or ask Mohsen."}
        </p>
      )}
    </section>
  );
}
