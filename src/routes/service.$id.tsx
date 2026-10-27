import { ServicePreview } from "@/components/service-preview";
import { MarketBrief } from "@/components/market-brief";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LEAP_SERVICES } from "@/lib/leap-services";
import { ExternalLink } from "@/components/external-link";
export const Route = createFileRoute("/service/$id")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q.slice(0, 120) : "السعودية",
  }),
  head: ({ params }) => ({
    meta: [
      { title: `${LEAP_SERVICES.find((s) => s.id === params.id)?.title || "خدمة"} · واحة` },
      { name: "description", content: "افتح خدمة الهجدة مع الحفاظ على مسارك في واحة." },
    ],
  }),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  const { q } = Route.useSearch();
  const service = LEAP_SERVICES.find((s) => s.id === id);
  return (
    <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-border bg-surface p-5">
      <Link to="/services" className="flex min-h-11 items-center text-primary">
        رجوع للخدمات ←
      </Link>
      <h1 className="font-display text-3xl">{service?.title || "الخدمة غير موجودة"}</h1>
      {service && (
        <>
          <p className="leading-8">
            {service.words} · يفتح الموقع الكامل بميزات حسابه المستقل. داخل التطبيق يُستخدم متصفح
            البيت مع الرجوع لواحة، وعلى الويب يفتح تبويبًا جديدًا.
          </p>
          {id === "hissati-explore" && (
            <p>
              استكشف المسارات والدروس، ومنها مسارات القدرات. التقدّم وحساب الطالب لدى حصتي مستقلان
              عن واحة.
            </p>
          )}
          {id === "store-collect" && <p>حجز مسبق فقط. لا دفع داخل واحة.</p>}
          {id.startsWith("market") && (
            <p>أسعار ومعلومات وليست توصيات. روبوت التداول افتراضي — بلا أموال حقيقية.</p>
          )}
          <ExternalLink
            direct
            href={service.href}
            className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 text-primary-fg"
          >
            فتح {service.title} ↗
          </ExternalLink>
          <ServicePreview key={id + q} id={id} initialQuery={q} />
          {id === "market-sa" && <MarketBrief />}
          {id === "wiki" && (
            <Link
              to="/mohsen"
              search={{
                q: "ابحث في موسوعة الهجدة عن تاريخ المملكة العربية السعودية",
                mode: "chat",
                attach: false,
              }}
              className="flex min-h-11 items-center text-primary"
            >
              اسأل الموسوعة عبر محسن ←
            </Link>
          )}
        </>
      )}
    </section>
  );
}
