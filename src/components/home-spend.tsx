import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { homeMoneyWidgets } from "@/lib/child-mode";
import { t, type Lang } from "@/lib/i18n";

type BudgetStore = { month: string; limit: number; items: { amount: number }[] };

function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function readMonthSpent(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("waha:budget");
    if (!raw) return 0;
    const store = JSON.parse(raw) as BudgetStore;
    const items = store.month === monthKey() ? store.items : [];
    return items.reduce((sum, item) => sum + item.amount, 0);
  } catch {
    return 0;
  }
}

/** Quiet home spend chips. Child mode must render nothing. */
export function HomeSpend({ lang, segment }: { lang: Lang; segment: unknown }) {
  const widgets = homeMoneyWidgets(segment);
  const [spent, setSpent] = useState(0);

  useEffect(() => {
    setSpent(readMonthSpent());
  }, []);

  if (widgets.length === 0) return null;

  return (
    <section className="mt-3" data-testid="home-spend" aria-label={t(lang, "todaySpend")}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {widgets.map((widget) => (
          <Link
            key={widget.id}
            to="/app/$id"
            params={{ id: "budget" }}
            className="rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
            data-testid={`home-spend-${widget.id}`}
          >
            <p className="text-xs text-muted">{widget.title[lang]}</p>
            <p className="mt-1 font-mono text-xl tabular-nums">
              {spent.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA")}
              <span className="ms-1 text-sm text-muted">SAR</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
