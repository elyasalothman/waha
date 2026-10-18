import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const proButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40";
export const proPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-fg hover:opacity-90 disabled:opacity-40";
export const proField =
  "min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary";

export function ProShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section dir="rtl" className="mx-auto max-w-4xl space-y-5 pb-10" aria-label={title}>
      <Link to="/store" className={proButton}>
        <ArrowRight className="size-4" aria-hidden="true" />
        المتجر
      </Link>
      <header className="space-y-2">
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="text-sm leading-7 text-muted">{subtitle}</p>
        <p className="flex items-center gap-1.5 text-xs text-primary">
          <ShieldCheck className="size-4" aria-hidden="true" />
          يعمل على جهازك بالكامل: لا رفع لملفاتك، ويعمل دون اتصال بعد أول فتح.
        </p>
      </header>
      {children}
    </section>
  );
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      {title && <h2 className="font-medium">{title}</h2>}
      {children}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="text-muted" dir="ltr">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        className="w-full accent-[var(--color-primary)]"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
