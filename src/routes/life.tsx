import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/hub";

export const Route = createFileRoute("/life")({ component: LifePage });

function LifePage() {
  return <Hub category="life" city />;
}
