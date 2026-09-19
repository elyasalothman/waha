import { allTopics, readForumDraft } from "./forum/store.ts";
import { SEED_POSTS } from "./square/seed.ts";

/** Honor a PIN already stored by an earlier Waha build. */
export const ADMIN_PIN_KEYS = ["waha:admin-pin", "waha:pin", "waha:adminPin", "waha:admin:pin"] as const;
export const DEFAULT_ADMIN_PIN = "1370";
export const ADMIN_SESSION_KEY = "waha:admin-ok";
export const HIDDEN_POSTS_KEY = "waha:hidden-posts";

export type HiddenPosts = {
  forum: string[];
  maydan: string[];
};

export type ModeratedKind = keyof HiddenPosts;

const EMPTY_HIDDEN: HiddenPosts = { forum: [], maydan: [] };

export function readAdminPin(storage: Pick<Storage, "getItem"> | null): string {
  if (!storage) return DEFAULT_ADMIN_PIN;
  for (const key of ADMIN_PIN_KEYS) {
    try {
      const value = storage.getItem(key)?.trim();
      if (value) return value;
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_ADMIN_PIN;
}

export function writeAdminPin(pin: string, storage: Pick<Storage, "setItem"> | null) {
  const clean = pin.trim();
  if (!clean || !storage) return;
  try {
    storage.setItem(ADMIN_PIN_KEYS[0], clean);
  } catch {
    /* quota */
  }
}

export function pinMatches(input: string, storage: Pick<Storage, "getItem"> | null): boolean {
  return input.trim() === readAdminPin(storage);
}

export function parseHiddenPosts(raw: string | null): HiddenPosts {
  if (!raw) return { forum: [], maydan: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<HiddenPosts>;
    return {
      forum: Array.isArray(parsed.forum) ? parsed.forum.map(String) : [],
      maydan: Array.isArray(parsed.maydan) ? parsed.maydan.map(String) : [],
    };
  } catch {
    return { forum: [], maydan: [] };
  }
}

export function readHiddenPosts(storage: Pick<Storage, "getItem"> | null): HiddenPosts {
  if (!storage) return EMPTY_HIDDEN;
  try {
    return parseHiddenPosts(storage.getItem(HIDDEN_POSTS_KEY));
  } catch {
    return EMPTY_HIDDEN;
  }
}

export function writeHiddenPosts(hidden: HiddenPosts, storage: Pick<Storage, "setItem"> | null) {
  if (!storage) return;
  try {
    storage.setItem(HIDDEN_POSTS_KEY, JSON.stringify(hidden));
  } catch {
    /* quota */
  }
}

export function hidePost(kind: ModeratedKind, id: string, hidden: HiddenPosts): HiddenPosts {
  const list = hidden[kind];
  if (list.includes(id)) return hidden;
  return { ...hidden, [kind]: [...list, id] };
}

export function unhidePost(kind: ModeratedKind, id: string, hidden: HiddenPosts): HiddenPosts {
  return { ...hidden, [kind]: hidden[kind].filter((item) => item !== id) };
}

export function listSquarePosts(hiddenIds: readonly string[] = []) {
  const hidden = new Set(hiddenIds);
  return SEED_POSTS.filter((post) => !hidden.has(post.id)).map((post) => ({
    id: post.id,
    text: post.text,
    author: post.author,
  }));
}

export function adminStats(storage: Pick<Storage, "getItem"> | null) {
  const hidden = readHiddenPosts(storage);
  const draft = readForumDraft(storage);
  const forumVisible = allTopics(draft, hidden.forum);
  const forumAll = allTopics(draft, []);
  const maydanVisible = listSquarePosts(hidden.maydan);
  const maydanAll = listSquarePosts([]);
  return {
    forumTopics: forumVisible.length,
    forumHidden: hidden.forum.length,
    forumTotal: forumAll.length,
    maydanPosts: maydanVisible.length,
    maydanHidden: hidden.maydan.length,
    maydanTotal: maydanAll.length,
    hiddenTotal: hidden.forum.length + hidden.maydan.length,
  };
}
