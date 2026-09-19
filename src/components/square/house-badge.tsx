import { WahaMark } from "@/components/brand";
import { SAMPLE_STAMP_AR, SAMPLE_STAMP_EN } from "@/lib/square/accounts";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function HouseBadge({ lang, className }: { lang: Lang; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-primary/30 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-primary",
        className,
      )}
      title={lang === "ar" ? "حساب رسمي للبيت" : "Official house account"}
    >
      <WahaMark className="size-3" />
      <span>{lang === "ar" ? "بيت" : "House"}</span>
    </span>
  );
}

export function SampleStamp({ lang }: { lang: Lang }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/80 bg-bg/40 px-1.5 py-0.5 text-[10px] text-subtle">
      {lang === "ar" ? SAMPLE_STAMP_AR : SAMPLE_STAMP_EN}
    </span>
  );
}

export function AvatarMark({
  letter,
  tone,
  house,
}: {
  letter: string;
  tone: string;
  house?: boolean;
}) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full text-sm font-medium",
        house ? "ring-1 ring-primary/40" : "ring-1 ring-border",
      )}
      style={{ background: `${tone}22`, color: tone }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
