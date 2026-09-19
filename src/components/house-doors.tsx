import { ExternalLink } from "@/components/external-link";
import { HOUSE_DESTINATIONS } from "@/lib/native-browser";
import { useAppStore } from "@/store/app-store";

/** بيت الهجدة — تهجد / محسن / ألعاب / حياة تفتح خارج WKWebView. */
export function HouseDoors() {
  const lang = useAppStore((s) => s.lang);

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted">
        {lang === "ar" ? "بيت الهجدة" : "Alhajda house"}
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {HOUSE_DESTINATIONS.map((row) => (
          <ExternalLink
            key={row.id}
            href={row.href}
            className="flex min-h-16 flex-col justify-center rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
          >
            <span className="font-medium">{lang === "ar" ? row.ar : row.en}</span>
            <span className="mt-1 text-xs text-muted">{lang === "ar" ? row.blurbAr : row.blurbEn}</span>
          </ExternalLink>
        ))}
      </div>
    </section>
  );
}
