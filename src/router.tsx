import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultPendingMs: 200,
    defaultPendingComponent: () => (
      <p role="status" className="min-h-40 animate-pulse py-8 text-center text-muted">
        جارٍ تحميل واحتك…
      </p>
    ),
    defaultNotFoundComponent: () => (
      <section className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-display text-2xl">الصفحة غير موجودة</h1>
        <p className="mt-3 text-muted">قد يكون الرابط قد تغيّر. استكشف أدوات واحة من الرئيسية.</p>
        <a
          href="/"
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-primary-fg"
        >
          العودة إلى واحة
        </a>
      </section>
    ),
  });
}
