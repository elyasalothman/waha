import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/hub";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "مساحة العمل · واحة" },
      { name: "description", content: "نظم مهامك وملاحظاتك واجتماعاتك وعملاءك بأدوات واحة." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  return <Hub category="workspace" />;
}
