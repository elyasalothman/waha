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
