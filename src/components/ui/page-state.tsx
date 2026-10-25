import type { ReactNode } from "react";
import { Button } from "./button";
export function PageState({
  title,
  children,
  retry,
}: {
  title: string;
  children?: ReactNode;
  retry?: () => void;
}) {
  return (
    <div
      role={retry ? "alert" : "status"}
      className="rounded-xl border border-border bg-surface p-5 text-muted"
    >
      <p className="font-medium text-fg">{title}</p>
      {children && <div className="mt-2 text-sm leading-7">{children}</div>}
      {retry && (
        <Button variant="secondary" className="mt-3" onClick={retry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`animate-pulse rounded-lg bg-surface-2 ${className}`} />
  );
}
