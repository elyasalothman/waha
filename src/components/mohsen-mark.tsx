import { cn } from "@/lib/cn";

/** Visual states. They describe the conversation, not a claimed feeling. */
export const MOHSEN_MOODS = ["idle", "listening", "thinking", "responding", "happy", "confused"] as const;
export type MohsenMood = (typeof MOHSEN_MOODS)[number];

const MOOD_LABEL: Record<MohsenMood, string> = {
  idle: "شكل نجدي ساكن",
  listening: "شكل نجدي أثناء الإملاء",
  thinking: "شكل نجدي أثناء ترتيب الجواب",
  responding: "شكل نجدي بعد وصول الجواب",
  happy: "شكل نجدي بعد إفادة الجواب",
  confused: "شكل نجدي عند تعذر الطلب",
};

/** An abstract Najdi door: mud crenellations, painted panels, and a Sadu band. Not a face. */
export function MohsenMark({ mood = "idle", className }: { mood?: MohsenMood; className?: string }) {
  return (
    <span className={cn("mohsen-mark", `is-${mood}`, className)} data-mohsen-mood={mood} role="img" aria-label={MOOD_LABEL[mood]}>
      <svg viewBox="0 0 120 148" aria-hidden="true">
        <g className="crenel">
          {[18, 36, 54, 72, 90].map((x) => (
            <polygon key={x} points={`${x},20 ${x + 12},20 ${x + 6},8`} className="mud" />
          ))}
        </g>
        <rect x="16" y="20" width="88" height="112" rx="2" className="mud frame" />
        <rect x="28" y="32" width="64" height="88" className="cream door" />
        <g className="pattern">
          <g className="drift">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <polygon
                key={i}
                points={`${32 + i * 10},40 ${37 + i * 10},48 ${42 + i * 10},40`}
                className={i % 2 ? "door-gold" : "door-teal"}
              />
            ))}
          </g>
          <g className="sadu">
            {[0, 1, 2, 3].map((i) => (
              <polygon
                key={i}
                points={`${36 + i * 14},62 ${43 + i * 14},69 ${36 + i * 14},76 ${29 + i * 14},69`}
                className={i % 2 ? "door-clay" : "door-ink"}
              />
            ))}
          </g>
          <g className="wash">
            {[0, 1, 2, 3, 4].map((i) => (
              <polygon
                key={i}
                points={`${34 + i * 12},86 ${40 + i * 12},94 ${46 + i * 12},86`}
                className={i % 2 ? "door-green accent" : "door-clay accent"}
              />
            ))}
          </g>
          <rect x="36" y="102" width="48" height="8" className="door-gold" />
        </g>
      </svg>
    </span>
  );
}
