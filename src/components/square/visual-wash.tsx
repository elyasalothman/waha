import type { KingVisual } from "@/lib/square/types";
import { cn } from "@/lib/cn";

function colorsOf(visual: KingVisual): string[] {
  if (typeof visual === "object" && Array.isArray(visual.colors) && visual.colors.length) {
    return visual.colors;
  }
  if (typeof visual === "string") {
    if (visual.includes("زيتوني")) return ["#2a3228", "#c5d0c4", "#1a1e1a"];
    if (visual.includes("صلاة") || visual.includes("هلال")) return ["#12161a", "#b8c4c8", "#1c2220"];
    if (visual.includes("دفتر") || visual.includes("كريمية")) return ["#2a261c", "#d4c7b0", "#1a1814"];
    if (visual.includes("ذكاء") || visual.includes("رمادية")) return ["#1c1e20", "#b8c0c4", "#222426"];
    if (visual.includes("لعبة") || visual.includes("دافئة")) return ["#2a2218", "#d0c4b0", "#1a1612"];
    if (visual.includes("مدار") || visual.includes("بحث")) return ["#142028", "#b0c4c8", "#1a2228"];
    if (visual.includes("أداة") || visual.includes("إعداد")) return ["#1a201e", "#b8c8c0", "#222826"];
    if (visual.includes("أخضر")) return ["#1a221c", "#8d938c", "#151816"];
    if (visual.includes("رملي") || visual.includes("مزاح")) return ["#2a2620", "#c4a484", "#1a1814"];
    if (visual.includes("أزرق")) return ["#141a24", "#8aa0b4", "#12161a"];
    if (visual.includes("بنفسجي")) return ["#1c1824", "#a898b4", "#16141c"];
    if (visual.includes("كود") || visual.includes("داكنة")) return ["#121416", "#6a7069", "#1a1c1e"];
  }
  return ["#1a1e1c", "#c5d0c4", "#222826"];
}

/** Thin faceless wash bound to the king `visual` field. */
export function VisualWash({ visual, className }: { visual: KingVisual; className?: string }) {
  const colors = colorsOf(visual);
  const a = colors[0] ?? "#1a1e1c";
  const b = colors[1] ?? "#c5d0c4";
  const c = colors[2] ?? a;
  return (
    <div className={cn("overflow-hidden rounded-md border border-border", className)} aria-hidden="true">
      <div
        className="h-14 w-full"
        style={{
          background: `linear-gradient(120deg, ${a} 0%, ${b}33 48%, ${c} 100%)`,
        }}
      />
    </div>
  );
}
