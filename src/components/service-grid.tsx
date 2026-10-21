import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { findServices, HOME_SERVICE_IDS } from "@/lib/superapp";
import { appIcon } from "@/lib/icons";
import { useAppStore } from "@/store/app-store";
import { hideMoney, isMoneySurface } from "@/lib/child-mode";

const SHORTCUT_LABELS: Record<string, { ar: string; en: string }> = {
  midad: { ar: "الكتب", en: "Books" },
  quran: { ar: "القرآن", en: "Quran" },
  tahajjud: { ar: "الصلاة", en: "Prayer" },
  hissati: { ar: "حصتي", en: "Learn" },
  store: { ar: "المتجر", en: "Store" },
  calc: { ar: "الحاسبة", en: "Calculator" },
  mohsin: { ar: "اسأل محسن", en: "Ask Mohsen" },
  dallah: { ar: "لعبة الدلّة", en: "Dallah Jump" },
};

export function ServiceGrid({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const lang = useAppStore((s) => s.lang);
  const segment = useAppStore((s) => s.segment);
  const pushRecent = useAppStore((s) => s.pushRecent);
  const items = findServices(query, "all").filter((s) => !hideMoney(segment) || !isMoneySurface(s));
  const shown =
    compact && !query.trim()
      ? HOME_SERVICE_IDS.map((id) => items.find((s) => s.id === id)).filter((s) => s != null)
      : items;
  const groups =
    compact || query.trim()
      ? [{ id: "results", ar: "", en: "", items: shown }]
      : [
          { id: "faith", ar: "العبادة", en: "Faith" },
          { id: "learn", ar: "التعلّم والأدوات", en: "Learning & tools" },
          { id: "news", ar: "الحياة والمجتمع", en: "Life & community" },
          { id: "fun", ar: "الألعاب والترفيه", en: "Games & fun" },
        ].map((group) => ({ ...group, items: shown.filter((s) => s.pillar === group.id) }));
  return (
    <section className="space-y-4" aria-label={lang === "ar" ? "خدمات واحة" : "Waha services"}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={compact ? "font-display text-2xl" : "sr-only"}>
          {lang === "ar"
            ? compact
              ? "ماذا تحتاج اليوم؟"
              : "كل الخدمات"
            : compact
              ? "What do you need today?"
              : "All services"}
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
      {query && (
        <p role="status" className="text-sm text-muted">
          {shown.length} {lang === "ar" ? "نتيجة" : "results"}
        </p>
      )}
      {groups.map(
        (group) =>
          group.items.length > 0 && (
            <section key={group.id} className="space-y-4" aria-label={group[lang] || undefined}>
              {group[lang] && <h3 className="font-display text-xl">{group[lang]}</h3>}
              <div
                className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}
              >
                {group.items.map((s) => {
                  const Icon = appIcon(s.icon);
                  return (
                    <Link
                      to={s.href}
                      key={s.id}
                      onClick={() => pushRecent(s.id)}
                      className="group flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-2 py-4 text-center hover:bg-surface-2"
                    >
                      <span className="grid size-11 place-items-center rounded-2xl bg-surface-2 text-primary">
                        <Icon className="size-5" strokeWidth={1.7} />
                      </span>
                      <span className="text-base font-medium leading-6">
                        {(compact ? SHORTCUT_LABELS[s.id] : undefined)?.[lang] || s.title[lang]}
                      </span>
                      {!compact && (
                        <span className="text-base leading-7 text-muted">{s.blurb[lang]}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ),
      )}
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
