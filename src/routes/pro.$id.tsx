import { lazy, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PRO_TOOLS } from "@/lib/store/pro";

const APPS = {
  cv: lazy(() => import("@/apps/pro/cv-builder").then((m) => ({ default: m.CvBuilderApp }))),
  pdf: lazy(() => import("@/apps/pro/pdf-studio").then((m) => ({ default: m.PdfStudioApp }))),
  scan: lazy(() => import("@/apps/pro/scanner").then((m) => ({ default: m.ScannerApp }))),
  image: lazy(() => import("@/apps/pro/image-studio").then((m) => ({ default: m.ImageStudioApp }))),
} as const;

export const Route = createFileRoute("/pro/$id")({
  head: ({ params }) => {
    const tool = PRO_TOOLS.find((t) => t.slug === params.id);
    return {
      meta: [
        { title: `${tool?.name ?? "أداة"} · متجر واحة` },
        { name: "description", content: tool?.description ?? "أدوات واحة المجانية." },
      ],
    };
  },
  component: ProPage,
});

function ProPage() {
  const { id } = Route.useParams();
  const App = APPS[id as keyof typeof APPS];
  if (!App)
    return (
      <div dir="rtl" className="mx-auto max-w-xl space-y-4 p-6 text-center">
        <p>هذه الأداة غير موجودة.</p>
        <Link to="/store" className="text-primary underline">
          العودة إلى المتجر
        </Link>
      </div>
    );
  return (
    <Suspense
      fallback={
        <p dir="rtl" role="status" className="p-6 text-center text-muted">
          جارٍ فتح الأداة…
        </p>
      }
    >
      <App />
    </Suspense>
  );
}
