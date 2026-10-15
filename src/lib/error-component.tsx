import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useAppStore } from "@/store/app-store";

export function AppErrorComponent({ reset }: ErrorComponentProps) {
  const ar = useAppStore((s) => s.lang) === "ar";
  return (
    <section
      role="alert"
      className="mx-auto flex min-h-64 max-w-lg flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center text-fg"
    >
      <TriangleAlert className="size-9 text-warn" aria-hidden="true" />
      <h1 className="font-display text-2xl">
        {ar ? "تعذّر تحميل هذه الصفحة" : "This page could not load"}
      </h1>
      <p className="text-sm leading-relaxed text-muted">
        {ar
          ? "تحقق من اتصالك ثم أعد المحاولة. بياناتك المحفوظة على جهازك باقية."
          : "Check your connection and try again. Your locally saved data is still on this device."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-lg bg-primary px-5 text-primary-fg"
        >
          {ar ? "إعادة المحاولة" : "Try again"}
        </button>
        <a
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-primary"
        >
          {ar ? "الرئيسية" : "Home"}
        </a>
      </div>
    </section>
  );
}
