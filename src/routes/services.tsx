import { createFileRoute } from "@tanstack/react-router";
import { LeapDirectory } from "@/components/leap-directory";
export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "كل خدمات الهجدة · واحة" },
      {
        name: "description",
        content: "حصتي والموسوعة والأخبار والمحللون والأسواق وأدوات الهجدة والألعاب والمقتنيات.",
      },
    ],
  }),
  component: LeapDirectory,
});
