/** Isolated from `waha:square:v1` and `waha:square:world:v1`. */
export const X_STORAGE_KEY = "waha:x:v1";
export const X_STAMP = "من إكس · معلَّم";
export const X_LANE = "من إكس";
export const X_SEED_COUNT = 10;
export const X_STRIP_CAP = 20;

export type XCard = {
  id: string;
  lane: typeof X_LANE;
  stamp: typeof X_STAMP;
  text: string;
  authorName: string;
  authorHandle: string;
  sourceUrl: string;
  fetchedAt: string;
  topic: string;
  whitelistId: string;
  counters: null;
  notHouseSeed: true;
  trusted: true;
  sourceKind: "x-public-oembed";
};

export type XLocalState = {
  version: 1;
  seededIds: string[];
};

export const EMPTY_X: XLocalState = {
  version: 1,
  seededIds: [],
};
