import { accountFromSeed, YOU_ACCOUNT } from "./accounts.ts";
import { SEED_POSTS } from "./seed.ts";
import type { FeedItem, SquareLocalState, SquareProfile, SquareTab } from "./types.ts";

export const SQUARE_STORAGE_KEY = "waha:square:v1";
export const POST_CHAR_LIMIT = 280;

export const EMPTY_LOCAL: SquareLocalState = {
  version: 1,
  posts: [],
  replies: {},
  likes: [],
  echoes: [],
  profile: { name: "", bio: "" },
};

export function emptyLocal(): SquareLocalState {
  return {
    version: 1,
    posts: [],
    replies: {},
    likes: [],
    echoes: [],
    profile: { name: "", bio: "" },
  };
}

export function displayNameOf(profile: SquareProfile, fallbackAr = "ضيف الواحة", fallbackEn = "Oasis guest", lang: "ar" | "en" = "ar") {
  const name = profile.name.trim();
  if (name) return name;
  return lang === "ar" ? fallbackAr : fallbackEn;
}

export function youAccount(profile: SquareProfile, lang: "ar" | "en"): typeof YOU_ACCOUNT {
  const name = displayNameOf(profile, "ضيف الواحة", "Oasis guest", lang);
  return {
    ...YOU_ACCOUNT,
    nameAr: name,
    nameEn: name,
    bioAr: profile.bio.trim() || YOU_ACCOUNT.bioAr,
    bioEn: profile.bio.trim() || YOU_ACCOUNT.bioEn,
  };
}

export function mergeFeed(local: SquareLocalState, tab: SquareTab, now = Date.now(), lang: "ar" | "en" = "ar"): FeedItem[] {
  const you = youAccount(local.profile, lang);
  const liked = new Set(local.likes);
  const echoed = new Set(local.echoes);

  const seedItems: FeedItem[] = SEED_POSTS.map((post, index) => {
    const author = accountFromSeed(post.author, post.handle, post.badge);
    return {
      id: post.id,
      source: "seed",
      author,
      badge: post.badge,
      text: post.text,
      visual: post.visual,
      relativeTime: post.relativeTime,
      createdAt: now - (index + 1) * 60_000,
      likes: post.likes + (liked.has(post.id) ? 1 : 0),
      echoes: echoed.has(post.id) ? 1 : 0,
      liked: liked.has(post.id),
      echoed: echoed.has(post.id),
      userReplies: local.replies[post.id] ?? [],
    };
  });

  const userItems: FeedItem[] = local.posts.map((post) => ({
    id: post.id,
    source: "you" as const,
    author: you,
    text: post.text,
    createdAt: post.createdAt,
    likes: liked.has(post.id) ? 1 : 0,
    echoes: echoed.has(post.id) ? 1 : 0,
    liked: liked.has(post.id),
    echoed: echoed.has(post.id),
    userReplies: local.replies[post.id] ?? [],
  }));

  // Local write first — before any seed counts.
  const merged = [...userItems, ...seedItems];
  if (tab === "following") {
    return merged.filter((item) => item.author.kind === "house" || item.source === "you");
  }
  return merged;
}

export function addPost(local: SquareLocalState, text: string, now = Date.now()): SquareLocalState {
  const trimmed = text.trim().slice(0, POST_CHAR_LIMIT);
  if (!trimmed) return local;
  return {
    ...local,
    posts: [{ id: `you-${now}`, text: trimmed, createdAt: now }, ...local.posts],
  };
}

export function toggleLike(local: SquareLocalState, postId: string): SquareLocalState {
  const likes = local.likes.includes(postId)
    ? local.likes.filter((id) => id !== postId)
    : [...local.likes, postId];
  return { ...local, likes };
}

export function toggleEcho(local: SquareLocalState, postId: string): SquareLocalState {
  const echoes = local.echoes.includes(postId)
    ? local.echoes.filter((id) => id !== postId)
    : [...local.echoes, postId];
  return { ...local, echoes };
}

export function addReply(local: SquareLocalState, postId: string, text: string, authorName: string, now = Date.now()): SquareLocalState {
  const trimmed = text.trim().slice(0, POST_CHAR_LIMIT);
  if (!trimmed) return local;
  const list = local.replies[postId] ?? [];
  return {
    ...local,
    replies: {
      ...local.replies,
      [postId]: [...list, { id: `reply-${now}`, text: trimmed, createdAt: now, authorName }],
    },
  };
}

export function updateProfile(local: SquareLocalState, profile: SquareProfile): SquareLocalState {
  return { ...local, profile: { name: profile.name.trim().slice(0, 40), bio: profile.bio.trim().slice(0, 160) } };
}

export function deleteOwnPost(local: SquareLocalState, postId: string): SquareLocalState {
  if (!postId.startsWith("you-")) return local;
  const replies = { ...local.replies };
  delete replies[postId];
  return {
    ...local,
    posts: local.posts.filter((p) => p.id !== postId),
    likes: local.likes.filter((id) => id !== postId),
    echoes: local.echoes.filter((id) => id !== postId),
    replies,
  };
}
