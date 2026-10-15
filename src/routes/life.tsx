import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/hub";

export const Route = createFileRoute("/life")({
  head: () => ({
    meta: [
      { title: "حياة · واحة" },
      {
        name: "description",
        content: "مواقيت الصلاة والأذكار والطقس وأدوات العائلة والصحة ليوم أكثر تنظيمًا.",
      },
    ],
  }),
  component: LifePage,
});

function LifePage() {
  return <Hub category="life" city />;
}
