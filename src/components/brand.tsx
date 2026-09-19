import { cn } from "@/lib/cn";

export function WahaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("text-primary", className)} aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 8.5v9.5M10.5 16.5c2.4 4.2 8.6 4.2 11 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function WahaWordmark({ lang }: { lang: "ar" | "en" }) {
  return (
    <span className="flex items-center gap-2.5">
      <WahaMark className="size-7" />
      <span className="font-display text-2xl leading-none tracking-tight">{lang === "ar" ? "واحة" : "Waha"}</span>
    </span>
  );
}

/** مدار — حلقة مدار مستقلة، بلا نخلة واحة. */
export function MadarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("text-primary", className)} aria-hidden="true">
      <circle cx="16" cy="16" r="11.2" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M7.4 18.2a9.2 6.6 0 1 0 17.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        opacity="0.55"
      />
      <circle cx="16" cy="16" r="1.45" fill="currentColor" />
    </svg>
  );
}

export function MadarWordmark({ lang }: { lang: "ar" | "en" }) {
  return (
    <span className="flex items-center gap-2.5">
      <MadarMark className="size-8" />
      <span className="font-display text-3xl leading-none tracking-tight">{lang === "ar" ? "مدار" : "Madar"}</span>
    </span>
  );
}

/** مقاطع مفيدة — إطار هادئ بلا أيقونة ميدان. */
export function ClipsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("text-primary", className)} aria-hidden="true">
      <rect x="5.5" y="8" width="21" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M13.2 12.4v7.2l6.4-3.6z" fill="currentColor" />
    </svg>
  );
}

/** رف كتب — ألواح هادئة بلا أيقونة ميدان. */
export function BooksMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("text-primary", className)} aria-hidden="true">
      <path
        d="M8 8.5h6.4c1.6 0 2.6 1 2.6 2.4v12.2c-1.3-.8-2.7-1.1-4.2-1.1H8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M24 8.5h-6.4c-1.6 0-2.6 1-2.6 2.4v12.2c1.3-.8 2.7-1.1 4.2-1.1H24z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M7.4 24.8h17.2" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
