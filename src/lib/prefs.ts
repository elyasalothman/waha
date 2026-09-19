import type { Audience } from "./catalog.ts";
import { parseChildSegment, type ChildSegment } from "./child-mode.ts";

/** Guest / not-yet-onboarded slice — never a leftover child that empties the Square. */
export const GUEST_SLICE = {
  audience: "personal" as const,
  segment: "all" as const,
  sliceChosen: false as const,
};

export type StoredSlice = {
  audience: Audience;
  segment: ChildSegment;
  sliceChosen: boolean;
};

/** Old chrome switcher wrote audience/segment without this flag — ignore those. */
export function resolveStoredSlice(parsed: {
  audience?: unknown;
  segment?: unknown;
  sliceChosen?: unknown;
} | null | undefined): StoredSlice {
  if (!parsed || parsed.sliceChosen !== true) {
    return { ...GUEST_SLICE };
  }
  const segment = parseChildSegment(parsed.segment);
  const audience: Audience =
    segment === "child" || segment === "family"
      ? "personal"
      : parsed.audience === "work"
        ? "work"
        : "personal";
  return { audience, segment, sliceChosen: true };
}

export function guestSeesFullSeed(): boolean {
  return GUEST_SLICE.audience === "personal" && GUEST_SLICE.segment === "all";
}
