import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/hub";

export const Route = createFileRoute("/workspace")({ component: WorkspacePage });

function WorkspacePage() {
  return <Hub category="workspace" />;
}
