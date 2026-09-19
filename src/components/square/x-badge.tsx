import { cn } from "@/lib/cn";
import { X_STAMP } from "@/lib/x";

/** Quiet house mark — not a chip that copies X/Twitter chrome. */
export function XBadge({ className }: { className?: string }) {
  return (
    <span data-x-stamp className={cn("text-[10px] font-medium tracking-wide text-primary", className)}>
      {X_STAMP}
    </span>
  );
}
