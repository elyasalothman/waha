import { createFileRoute, Link } from "@tanstack/react-router";
import { ServiceGrid } from "@/components/service-grid";
import { SquarePage } from "@/components/square/square-page";
import { moreOverflowNav } from "@/lib/nav";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "استكشف واحة · واحة" },
      { name: "description", content: "تصفح جميع تطبيقات واحة وابحث عن الأداة التي تحتاجها." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { view?: "square" } => ({
    view: search.view === "square" ? "square" : undefined,
  }),
  component: MorePage,
});

function MorePage() {
  const { view } = Route.useSearch();
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const segment = useAppStore((s) => s.segment);
  const hubs = moreOverflowNav(audience, segment);

  if (view === "square")
    return (
      <div>
        <div className="mx-auto mb-4 max-w-3xl">
          <Link
            to="/more"
            search={{}}
            className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
          >
            {lang === "ar" ? "العودة إلى استكشف" : "Back to Explore"}
          </Link>
          <h1 className="font-display text-3xl">
            {lang === "ar" ? "الميدان والأرشيف" : "Square & archive"}
          </h1>
        </div>
        <SquarePage />
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="font-display text-4xl tracking-tight">
          {lang === "ar" ? "كل الخدمات" : "All services"}
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          {lang === "ar"
            ? "ابحث عن خدمة أو اختر أحد الأقسام."
            : "Find a service or browse a section."}
        </p>
      </header>
      <ServiceGrid />
      <details className="mt-8 rounded-2xl border border-border p-5">
        <summary className="min-h-11 cursor-pointer content-center text-lg font-medium">
          {lang === "ar" ? "تصفح الأقسام" : "Browse sections"}
        </summary>
        <Link
          to="/more"
          search={{ view: "square" }}
          className="mt-6 mb-3 flex min-h-14 items-center rounded-xl border border-border bg-surface px-4 font-medium text-fg hover:bg-surface-2"
        >
          {lang === "ar"
            ? "الميدان والأرشيف · الصلاة وآية اليوم"
            : "Square & archive · Prayer & daily verse"}
        </Link>
        <Link
          to="/forum"
          className="mb-6 flex min-h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 text-fg hover:bg-surface-2"
        >
          <span>
            <span className="block font-medium">{t(lang, "forum")}</span>
            <span className="mt-0.5 block text-sm text-muted">{t(lang, "forumBlurb")}</span>
          </span>
        </Link>
        <nav aria-label={t(lang, "more")} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {hubs.map((hub) => (
            <Link
              key={hub.to}
              to={hub.to as "/life" | "/money" | "/tools" | "/games" | "/studio" | "/workspace"}
              className="flex min-h-14 items-center rounded-xl border border-border bg-surface px-4 text-fg hover:bg-surface-2"
            >
              <span className="font-medium">{t(lang, hub.key)}</span>
            </Link>
          ))}
          {audience === "personal" ? (
            <Link
              to="/workspace"
              className="flex min-h-14 items-center rounded-xl border border-border bg-surface px-4 font-medium text-fg hover:bg-surface-2"
            >
              {t(lang, "workspace")}
            </Link>
          ) : null}
        </nav>
      </details>
    </div>
  );
}
