import { cn } from "@/lib/cn";
import { X_STAMP } from "@/lib/x";

export function XBadge({ className }: { className?: string }) {
  return (
    <span
      data-x-stamp
      className={cn(
        "inline-flex items-center rounded-full border border-primary/30 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-primary",
        className,
      )}
    >
      {X_STAMP}
    </span>
  );
}
