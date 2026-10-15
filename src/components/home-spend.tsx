import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { homeMoneyWidgets } from "@/lib/child-mode";
import { type Lang } from "@/lib/i18n";
import { monthSpent } from "@/lib/home-spend";

/** Quiet home spend chips. Child mode must render nothing. */
export function HomeSpend({ lang, segment }: { lang: Lang; segment: unknown }) {
  const widgets = homeMoneyWidgets(segment);
  const [spent, setSpent] = useState(0);

  useEffect(() => {
    const refresh = () => {
      try {
        setSpent(monthSpent(localStorage.getItem("waha:budget")));
      } catch {
        setSpent(0);
      }
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  if (widgets.length === 0) return null;

  return (
    <section
      className="mt-3"
      data-testid="home-spend"
      aria-label={lang === "ar" ? "مصروف هذا الشهر" : "This month’s spending"}
    >
      <div className="grid grid-cols-1 gap-2">
        {widgets.map((widget) => (
          <Link
            key={widget.id}
            to="/app/$id"
            params={{ id: "budget" }}
            className="rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
            data-testid={`home-spend-${widget.id}`}
          >
            <p className="text-xs text-muted">
              {lang === "ar" ? "مصروف هذا الشهر" : "This month’s spending"}
            </p>
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
