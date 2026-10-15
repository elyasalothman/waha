import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/hub";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "الأدوات · واحة" },
      {
        name: "description",
        content: "حاسبات وتحويل وحدات وأدوات نصوص وتواريخ ورموز QR باللغة العربية.",
      },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  return <Hub category="tools" />;
}
