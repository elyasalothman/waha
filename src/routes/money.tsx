import { createFileRoute } from "@tanstack/react-router";
import { ChildMoneyGate } from "@/components/child-money-gate";
import { Hub } from "@/components/hub";
import { isChildMode } from "@/lib/child-mode";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/money")({ component: MoneyPage });

function MoneyPage() {
  const lang = useAppStore((s) => s.lang);
  const segment = useAppStore((s) => s.segment);
  if (isChildMode(segment)) return <ChildMoneyGate lang={lang} />;
  return <Hub category="money" />;
}
