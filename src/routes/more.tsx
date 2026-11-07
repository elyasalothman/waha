import { createFileRoute, Link } from "@tanstack/react-router";
import { ServiceGrid } from "@/components/service-grid";
import { SquarePage } from "@/components/square/square-page";
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
          {lang === "ar" ? "الأقسام" : "Sections"}
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          {lang === "ar"
            ? "القراءة والبحث أولاً، ثم قليل من الأخبار، واللعب الذي جُرّب، وأدوات تعمل هنا."
            : "Reading and research first, then a little news, games that were tried, and tools that run here."}
        </p>
        <nav className="mt-4" aria-label={lang === "ar" ? "الحساب والإعدادات" : "Account and settings"}>
          <Link to="/settings" hash="account" className="inline-flex min-h-11 items-center text-primary">
            {lang === "ar" ? "الحساب والإعدادات" : "Account and settings"}
          </Link>
        </nav>
      </header>
      <ServiceGrid />
    </div>
  );
}
