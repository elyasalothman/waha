import { Link } from "@tanstack/react-router";

/** Readable loading, missing, and retry states for in-app reading. */
export function ReadingStatus({
  title,
  state,
  detail,
  onRetry,
}: {
  title: string;
  state: "loading" | "error" | "missing";
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role={state === "loading" ? "status" : "alert"}
      data-reading-status={state}
      className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6"
    >
      <h1 className="font-display text-2xl">{title}</h1>
      <p className="mt-3 leading-7">
        {state === "loading"
          ? "جارٍ فتح النص…"
          : state === "missing"
            ? "لم نجد هذا النص في المكتبة."
            : "تعذّر فتح النص."}
      </p>
      {detail ? <p className="mt-2 text-sm leading-7 text-muted">{detail}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {onRetry ? (
          <button
            type="button"
            className="min-h-11 rounded-xl border border-border px-4"
            onClick={onRetry}
          >
            إعادة المحاولة
          </button>
        ) : null}
        <Link to="/books" className="inline-flex min-h-11 items-center text-primary">
          العودة إلى المكتبة
        </Link>
      </div>
    </div>
  );
}
