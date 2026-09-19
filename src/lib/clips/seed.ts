import cards from "./maydan-muaqata-mufida-cards-v1.json" with { type: "json" };
import seed from "./maydan-muaqata-mufida-seed-v1.json" with { type: "json" };
import { CLIP_TOPICS, type ClipCard, type ClipTopic } from "./types.ts";

export const CLIPS_SEED_COUNT = 12;

type SeedClip = ClipCard & {
  lane: string;
  durationHint?: string;
  lang?: string;
  embedAllowed?: boolean;
  onMaydanTimeline?: boolean;
  linkStatus?: string;
  status?: string;
};

type SeedFile = {
  version: number;
  status: string;
  councilLock: {
    route: string;
    chromeTabLikeMadar: boolean;
    notOnMaydanFeed: boolean;
    embedPlusOriginalLink: boolean;
    noAlgorithm: boolean;
    noSearchInProduction: boolean;
  };
  rules: {
    topics: string[];
    forbidden: string[];
    separateStore: string;
  };
  clips: SeedClip[];
  meta: { clipCount: number; allFixedWatch: boolean };
  implementationLock: {
    route: string;
    chromeTabLikeMadar: boolean;
    embed: string;
    originalLinkVisible: boolean;
    notOnMaydanFeed: boolean;
    noAlgorithm: boolean;
    clipCount: number;
  };
};

export const CLIPS_SEED = seed as SeedFile;

function asTopic(value: string): ClipTopic {
  if ((CLIP_TOPICS as readonly string[]).includes(value)) return value as ClipTopic;
  throw new Error(`clips seed: forbidden topic ${value}`);
}

function asCard(row: SeedClip | ClipCard): ClipCard {
  return {
    id: row.id,
    titleAr: row.titleAr,
    benefitAr: row.benefitAr,
    topic: asTopic(row.topic),
    channel: row.channel,
    youtubeUrl: row.youtubeUrl,
    youtubeId: row.youtubeId,
    embedUrl: row.embedUrl,
    stamp: row.stamp,
  };
}

/** King-approved cards — source of truth for `/clips`. Seed file stays the lock. */
export const CLIP_CARDS: ClipCard[] = (cards as ClipCard[]).map(asCard);

export const CLIP_IDS = CLIP_CARDS.map((clip) => clip.id);

export function nocookieEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
}

export function watchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
