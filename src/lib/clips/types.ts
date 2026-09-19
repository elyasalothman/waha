export const CLIPS_STORAGE_KEY = "waha:clips:v1";

export const CLIP_TOPICS = ["علم", "تعليم", "عادة"] as const;
export type ClipTopic = (typeof CLIP_TOPICS)[number];

export type ClipCard = {
  id: string;
  titleAr: string;
  benefitAr: string;
  topic: ClipTopic;
  channel: string;
  youtubeUrl: string;
  youtubeId: string;
  embedUrl: string;
  stamp: string;
};

export type ClipsLocalState = {
  version: 1;
  seededIds: string[];
  seen: string[];
};

export const EMPTY_CLIPS: ClipsLocalState = {
  version: 1,
  seededIds: [],
  seen: [],
};
