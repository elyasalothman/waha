import { Link } from "@tanstack/react-router";
import { t, type Lang } from "@/lib/i18n";

/** Honest refusal — no PIN, no fake unlock. */
export function ChildMoneyGate({ lang }: { lang: Lang }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center" data-testid="child-money-gate">
      <h1 className="font-display text-3xl tracking-tight">{t(lang, "childMoneyBlocked")}</h1>
      <p className="mt-3 text-muted">{t(lang, "childMoneyBlockedBody")}</p>
      <Link to="/" className="mt-6 inline-block text-primary hover:underline">
        {t(lang, "home")}
      </Link>
    </div>
  );
}
