import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/hub";

export const Route = createFileRoute("/money")({ component: MoneyPage });

function MoneyPage() {
  return <Hub category="money" />;
}
