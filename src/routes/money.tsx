import { MarketBrief } from "@/components/market-brief";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChildMoneyGate } from "@/components/child-money-gate";
import { Hub } from "@/components/hub";
import { isChildMode } from "@/lib/child-mode";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/money")({
  head: () => ({
    meta: [
      { title: "المال · واحة" },
      {
        name: "description",
        content: "أدوات الميزانية والادخار والمصاريف والحسابات المالية اليومية.",
      },
    ],
  }),
  component: MoneyPage,
});

function MoneyPage() {
  const lang = useAppStore((s) => s.lang);
  const segment = useAppStore((s) => s.segment);
  if (isChildMode(segment)) return <ChildMoneyGate lang={lang} />;
  return (
    <div className="space-y-6">
      <MarketBrief />
      <Link to="/app/$id" params={{ id: "budget" }} className="waha-card tint-sand block">
        <h2 className="text-lg">{lang === "ar" ? "ميزانيتي" : "My budget"}</h2>
        <p className="mt-2 text-sm text-muted">
          {lang === "ar"
            ? "سجل الدخل والمصروف والفواتير المتكررة وأهداف الادخار. البيانات على هذا الجهاز."
            : "Log income, expenses, recurring bills, and savings goals. The data stays on this device."}
        </p>
      </Link>
      <Hub category="money" />
    </div>
  );
}
