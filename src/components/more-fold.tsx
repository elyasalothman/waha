import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function MoreFold({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-8" data-testid="more-fold">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-surface px-4 text-sm hover:bg-surface-2"
      >
        <span>{open ? t(lang, "less") : t(lang, "more")}</span>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="mt-6 space-y-8">{children}</div> : null}
    </section>
  );
}
