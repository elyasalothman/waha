/** Quiet shade↔field crossing on `/`. Thin shadow stays; the hero is the shade. */

export const SHADE_FIELD_CROSSING = "quiet" as const;
export const SHADE_FIELD_LANES = ["shade", "field"] as const;
export type ShadeFieldLane = (typeof SHADE_FIELD_LANES)[number];

/** Offset matches the chrome header so the hero is “gone” once it slips under it. */
export const SHADE_FIELD_HEADER_MARGIN = "-3.5rem 0px 0px 0px";

/** Hero still in view → shade. Hero past the chrome → field. */
export function laneFromHeroVisibility(heroIntersecting: boolean): ShadeFieldLane {
  return heroIntersecting ? "shade" : "field";
}

export function shadeFieldCrossing(): typeof SHADE_FIELD_CROSSING {
  return SHADE_FIELD_CROSSING;
}

export function shadeFieldAllowsRainbow(): boolean {
  return false;
}

export function shadeFieldAllowsBounce(): boolean {
  return false;
}

/** Lock: the thin bar remains while the field is read. */
export function shadeKeepsThinBarInField(): boolean {
  return true;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToShade(hero: HTMLElement | null): void {
  if (!hero) return;
  hero.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}
