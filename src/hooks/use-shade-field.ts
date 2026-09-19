import { useEffect, useState, type RefObject } from "react";
import {
  SHADE_FIELD_HEADER_MARGIN,
  laneFromHeroVisibility,
  type ShadeFieldLane,
} from "@/lib/shade-field";

/** Shade while the prayer hero is in view; field once it has crossed under the chrome. */
export function useShadeFieldLane(heroRef: RefObject<HTMLElement | null>): ShadeFieldLane {
  const [lane, setLane] = useState<ShadeFieldLane>("shade");

  useEffect(() => {
    const node = heroRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setLane(laneFromHeroVisibility(entry.isIntersecting));
      },
      { root: null, rootMargin: SHADE_FIELD_HEADER_MARGIN, threshold: 0 },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [heroRef]);

  return lane;
}
