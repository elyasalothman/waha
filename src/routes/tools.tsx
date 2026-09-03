import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/hub";

export const Route = createFileRoute("/tools")({ component: ToolsPage });

function ToolsPage() {
  return <Hub category="tools" />;
}
