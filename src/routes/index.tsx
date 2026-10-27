import { createFileRoute } from "@tanstack/react-router";
import { LeapHome } from "@/components/leap-home";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "واحة · كل عالمك في مكان واحد" },
      {
        name: "description",
        content: "خدمات الهجدة: حصتي والكتب والألعاب والعبادة والأخبار ومحسن في واحة يومك.",
      },
    ],
  }),
  component: LeapHome,
});
