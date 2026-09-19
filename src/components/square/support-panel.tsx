import { Button } from "@/components/ui/button";
import { claimsLivePayment, houseProductDoors, resolveSupportPath } from "@/lib/square/soft-money";
import type { Lang } from "@/lib/i18n";

export function SupportPanel({
  open,
  lang,
  onClose,
}: {
  open: boolean;
  lang: Lang;
  onClose: () => void;
}) {
  if (!open) return null;

  const path = resolveSupportPath();
  const live = claimsLivePayment(path);
  const products = houseProductDoors();
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-bg/70" aria-label={L("إغلاق", "Close")} onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-t-xl border border-border bg-surface p-5 shadow-(--shadow-soft) sm:rounded-xl"
        data-soft-money="panel"
        data-support-kind={path.kind}
      >
        <h2 className="font-display text-2xl">{L("ادعم واحة", "Support Waha")}</h2>
        <p className="mt-1 text-sm text-muted">
          {L("بقشيش صغير إن تيسّر. بلا إلحاح، وبلا إعلان.", "A small tip if it comes easily. No pressure, and no ads.")}
        </p>

        {live && path.kind === "live" ? (
          <a
            href={path.href}
            className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg hover:opacity-90"
          >
            {L("افتح مسار الدعم", "Open the support path")}
          </a>
        ) : (
          <div className="mt-4 rounded-lg border border-border bg-bg/40 px-3 py-3">
            <p className="text-sm font-medium text-fg">{L("قريباً", "Coming soon")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {L(
                "لا مسار قبض حي اليوم. لن نضع زراً يدّعي الدفع.",
                "There is no live payment path today. We will not show a button that pretends to charge.",
              )}
            </p>
          </div>
        )}

        <p className="mt-4 text-xs text-subtle">
          {L("إن أحببت البيت الآن — قيمة، لا سبام:", "If you want the house now — value, not spam:")}
        </p>
        <nav className="mt-2 flex flex-wrap gap-2" aria-label={L("منتجات البيت", "House products")}>
          {products.map((door) => (
            <a
              key={door.id}
              href={door.href}
              data-door={door.id}
              className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs text-muted hover:bg-surface-2 hover:text-fg"
            >
              {door.title[lang]}
            </a>
          ))}
        </nav>

        {path.kind === "coming-soon" ? (
          <p className="mt-4 text-xs leading-relaxed text-subtle">
            {L("وللكتابة بهدوء:", "To write quietly:")}{" "}
            <a href={path.contactHref} className="text-muted hover:text-fg hover:underline">
              {path.email}
            </a>
          </p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            {L("إغلاق", "Close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
