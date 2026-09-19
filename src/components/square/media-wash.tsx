import type { SquareMediaKind } from "@/lib/square/types";
import { cn } from "@/lib/cn";

/** Calm, faceless washes — dunes, night, palm, ink, mist. No photographs of people. */
export function MediaWash({ kind, className }: { kind: SquareMediaKind; className?: string }) {
  const id = `wash-${kind}`;
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border", className)}>
      <svg viewBox="0 0 320 140" className="block h-auto w-full" aria-hidden="true">
        <defs>
          {kind === "dune" ? (
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2a2620" />
              <stop offset="0.45" stopColor="#3d382e" />
              <stop offset="1" stopColor="#1a1814" />
            </linearGradient>
          ) : null}
          {kind === "night" ? (
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#12161a" />
              <stop offset="1" stopColor="#1c2220" />
            </linearGradient>
          ) : null}
          {kind === "palm" ? (
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1a221c" />
              <stop offset="1" stopColor="#151816" />
            </linearGradient>
          ) : null}
          {kind === "ink" ? (
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1c1b18" />
              <stop offset="1" stopColor="#24221c" />
            </linearGradient>
          ) : null}
          {kind === "mist" ? (
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1a1e1c" />
              <stop offset="1" stopColor="#222826" />
            </linearGradient>
          ) : null}
        </defs>
        <rect width="320" height="140" fill={`url(#${id}-g)`} />
        {kind === "dune" ? (
          <>
            <path d="M0 92 C70 70 140 110 220 78 C260 66 290 80 320 72 V140 H0 Z" fill="#2f2b24" />
            <path d="M0 110 C90 96 160 124 320 100 V140 H0 Z" fill="#181610" />
          </>
        ) : null}
        {kind === "night" ? (
          <>
            <circle cx="248" cy="36" r="11" fill="#c5d0c4" opacity="0.35" />
            <circle cx="52" cy="28" r="1.2" fill="#eceee9" opacity="0.55" />
            <circle cx="88" cy="44" r="0.9" fill="#eceee9" opacity="0.4" />
            <circle cx="140" cy="22" r="1" fill="#eceee9" opacity="0.45" />
            <circle cx="190" cy="50" r="0.8" fill="#eceee9" opacity="0.35" />
            <path d="M0 108 C80 96 180 118 320 102 V140 H0 Z" fill="#151916" />
          </>
        ) : null}
        {kind === "palm" ? (
          <>
            <path d="M168 140 V78" stroke="#6a7069" strokeWidth="3" fill="none" />
            <path
              d="M168 80 C140 70 120 48 128 36 M168 80 C196 70 214 46 204 34 M168 78 C150 60 158 28 176 32 M168 78 C186 62 180 30 162 36"
              stroke="#8d938c"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M0 118 C80 108 200 124 320 112 V140 H0 Z" fill="#121512" />
          </>
        ) : null}
        {kind === "ink" ? (
          <>
            <path d="M40 40 H280" stroke="#6a7069" strokeWidth="1" opacity="0.35" />
            <path d="M40 62 H240" stroke="#8d938c" strokeWidth="1" opacity="0.25" />
            <path d="M40 84 H200" stroke="#6a7069" strokeWidth="1" opacity="0.2" />
            <circle cx="56" cy="108" r="10" fill="none" stroke="#c5d0c4" strokeWidth="1" opacity="0.35" />
          </>
        ) : null}
        {kind === "mist" ? (
          <>
            <ellipse cx="160" cy="88" rx="90" ry="18" fill="#c5d0c4" opacity="0.06" />
            <ellipse cx="120" cy="70" rx="60" ry="12" fill="#c5d0c4" opacity="0.05" />
            <circle cx="160" cy="96" r="16" fill="none" stroke="#8d938c" strokeWidth="1.2" opacity="0.35" />
            <circle cx="160" cy="96" r="8" fill="none" stroke="#c5d0c4" strokeWidth="1" opacity="0.25" />
          </>
        ) : null}
      </svg>
    </div>
  );
}
