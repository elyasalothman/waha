import { Link } from "@tanstack/react-router";
import { useSettings } from "@/store/settings-store";
import { useArabicNews } from "@/lib/use-arabic-news";
import { Skeleton } from "./ui/page-state";
export function HomeNews({ compact = false, plain = false }: { compact?: boolean; plain?: boolean }) {
  const s = useSettings((x) => x.settings);
  const { data, failed } = useArabicNews();
  const items = (data?.items || [])
    .filter(
      (i) =>
        (!s.newsTopics.length || s.newsTopics.some((topic) => topic === i.topic)) &&
        (!s.newsSources.length || s.newsSources.includes(i.source as never)),
    )
    .slice(0, plain ? 3 : compact ? 1 : 3);
  return (
    <section
      aria-label={plain ? "أهم الأخبار" : "آخر الأخبار"}
      data-home-widget={plain ? "headlines" : undefined}
      className={plain ? "waha-card tint-rose" : `${compact ? "min-h-36" : "min-h-80"} rounded-2xl border border-border bg-surface p-4`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-lg ${plain ? "kicker-rose" : ""}`}>
          {plain ? "🗞️ أهم الأخبار" : "آخر الأخبار"}
        </h2>
        {plain ? null : (
          <Link to="/news" className="min-h-11 content-center text-primary">
            كل الأخبار ←
          </Link>
        )}
      </div>
      {!data && !failed && (
        <div role="status" aria-label="جارٍ تحميل العناوين" className="space-y-4 py-3">
          {(compact ? [0] : [0, 1, 2]).map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      )}
      {items.map((i) => {
        const body = (
          <>
            {i.title}
            <span className="block text-xs text-muted">
              {i.source} ·{" "}
              {new Intl.DateTimeFormat(s.language, {
                calendar: s.calendar,
                numberingSystem: s.digits,
                dateStyle: "short",
              }).format(new Date(i.publishedAt))}
            </span>
          </>
        );
        return plain ? (
          <p key={i.id} className="border-t border-border py-3 text-sm leading-7">
            {body}
          </p>
        ) : (
          <Link
            to="/news"
            key={i.id}
            className="block min-h-11 border-t border-border py-3 text-sm leading-7"
          >
            {body}
          </Link>
        );
      })}
      {!items.length && (failed || data) && (
        <p role="status" className="py-3 text-sm text-muted">
          {failed
            ? plain
              ? "تعذّر تحديث العناوين."
              : "تعذّر تحديث العناوين؛ افتح الأخبار لإعادة المحاولة"
            : data
              ? "لا توجد عناوين في أقسامك المفضلة الآن"
              : "جارٍ تحميل العناوين…"}
        </p>
      )}
      {failed && items.length > 0 && (
        <p className="text-xs text-muted">تعذّر التحديث. هذه آخر عناوين نجح جلبها.</p>
      )}
      {data?.fetchedAt && (
        <p className="text-xs text-muted">
          آخر جلب ناجح:{" "}
          <time dateTime={data.fetchedAt}>
            {new Intl.DateTimeFormat(s.language, {
              calendar: s.calendar,
              numberingSystem: s.digits,
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(data.fetchedAt))}
          </time>
          {data.status === "cached" ? " · من الذاكرة القصيرة" : ""}
        </p>
      )}
    </section>
  );
}
