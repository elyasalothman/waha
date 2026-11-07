import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "@/components/external-link";
import { RESEARCH_LINKS } from "@/lib/research-catalog";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "مركز الأبحاث · واحة" },
      {
        name: "description",
        content: "فهرس أوراق مركز أبحاث الهجدة. القراءة على lab.alhajda.com، بلا إطار داخل واحة.",
      },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  return (
    <div className="mx-auto max-w-3xl" dir="rtl">
      <header className="mb-6">
        <h1 className="font-display text-4xl">🔬 مركز الأبحاث</h1>
        <p className="mt-3 max-w-xl leading-8 text-muted">
          أوراق مكتبية على مركز أبحاث الهجدة. واحة تعرض الفهرس فقط؛ القراءة تبقى على موقع المركز،
          بلا إطار وبدون محرك بحث تفاعلي هنا.
        </p>
      </header>
      <ul className="space-y-3">
        {RESEARCH_LINKS.map((item) => (
          <li key={item.href} className="rounded-2xl border border-border bg-surface p-4">
            <ExternalLink direct href={item.href} className="font-medium text-primary">
              {item.title}
            </ExternalLink>
            <p className="mt-2 text-sm leading-7 text-muted">{item.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
