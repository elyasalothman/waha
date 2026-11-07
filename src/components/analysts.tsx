import { ExternalLink } from "./external-link";
import { useAnalysts } from "@/lib/use-analysts";

function when(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value;
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(time);
}

export function Analysts({ compact = false }: { compact?: boolean }) {
  const { data, failed, retry } = useAnalysts();
  const items = data?.items.slice(0, compact ? 1 : 12) ?? [];
  return (
    <section className="space-y-3" aria-label="من آراء المحللين">
      <h2 className="font-display text-xl">من آراء المحللين</h2>
      <p className="text-xs leading-6 text-muted">
        من هدوء السوق · آراء أصحابها بتاريخ النشر، لا توصيات استثمارية.
      </p>
      {!data && !failed ? <p role="status">جارٍ تحميل المحللين…</p> : null}
      {failed ? (
        <div role="status">
          <p>
            {items.length
              ? "تعذّر تحديث الآراء. المعروض آخر جلب ناجح، وليس رأياً جديداً."
              : "تعذّر تحميل الآراء. لا توجد آراء محفوظة بدل المصدر."}
          </p>
          <button type="button" className="min-h-11 px-3 underline" onClick={retry}>
            إعادة المحاولة
          </button>
        </div>
      ) : null}
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span
              style={{ backgroundColor: item.analyst.color }}
              className="grid size-11 shrink-0 place-items-center rounded-full text-sm text-white"
            >
              {item.analyst.ini}
            </span>
            <strong>{item.analyst.name}</strong>
          </div>
          <p className="mt-3 text-sm leading-7">{compact ? item.title : item.summary || item.title}</p>
          <p className="text-xs text-muted">
            نُشر في المصدر: <time dateTime={item.postedAt}>{when(item.postedAt)}</time>
          </p>
          <ExternalLink
            direct
            href={item.url}
            className="mt-2 flex min-h-11 items-center text-sm text-primary underline"
          >
            التغريدة الأصلية ↗
          </ExternalLink>
        </article>
      ))}
      {data?.fetchedAt ? (
        <p className="text-xs text-muted">
          آخر جلب من هدوء السوق: <time dateTime={data.fetchedAt}>{when(data.fetchedAt)}</time>
          {failed ? " · تعذّر أحدث محاولة" : ""}
        </p>
      ) : null}
      {!compact && data ? (
        <details>
          <summary className="min-h-11 content-center">دليل المحللين ({data.roster.length})</summary>
          {data.roster.map((person) => (
            <ExternalLink
              direct
              key={person.handle}
              href={person.url || `https://news.alhajda.com/analysts/${person.handle}`}
              className="block min-h-11 content-center py-2"
            >
              {person.name}
              {person.role ? ` · ${person.role}` : ""}
            </ExternalLink>
          ))}
        </details>
      ) : null}
      <ExternalLink
        direct
        href="https://news.alhajda.com/analysts"
        className="flex min-h-11 items-center text-sm text-primary"
      >
        كل آراء المحللين ↗
      </ExternalLink>
    </section>
  );
}
