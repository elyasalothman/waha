import { cn } from "@/lib/cn";
import { WORLD_STAMP } from "@/lib/square/world";

export function WorldBadge({ className }: { className?: string }) {
  return (
    <span
      data-world-stamp
      className={cn(
        "inline-flex items-center rounded-full border border-primary/30 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-primary",
        className,
      )}
    >
      {WORLD_STAMP}
    </span>
  );
}
