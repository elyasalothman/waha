export const SHADE_FIELD_CROSSING = "quiet" as const;
export const SHADE_FIELD_LANES = ["shade", "field"] as const;
export type ShadeFieldLane = (typeof SHADE_FIELD_LANES)[number];
