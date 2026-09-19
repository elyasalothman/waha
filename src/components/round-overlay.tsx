import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function RoundOverlay({
  title,
  detail,
  actionLabel,
  onAction,
  extra,
}: {
  title: string;
  detail?: string;
  actionLabel: string;
  onAction: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-bg/80 p-4 text-center">
      <p className="text-lg font-medium text-fg">{title}</p>
      {detail ? <p className="max-w-sm text-sm leading-relaxed text-muted">{detail}</p> : null}
      <Button onClick={onAction}>{actionLabel}</Button>
      {extra}
    </div>
  );
}
