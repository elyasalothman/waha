import { FORUM_BOARDS, type ForumBoardId, isForumBoardId } from "./boards.ts";
import { FORUM_SEED_REPLIES, FORUM_SEED_TOPICS } from "./seed.ts";
import type { ForumDraft, ForumReply, ForumTopic } from "./types.ts";

export const FORUM_DRAFT_KEY = "waha:forum-draft";

export const GUEST_AUTHOR = { id: "local", name: "أنت" } as const;

const EMPTY_DRAFT: ForumDraft = { extras: [], replies: [] };

export function parseForumDraft(raw: string | null): ForumDraft {
  if (!raw) return { extras: [], replies: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<ForumDraft>;
    const extras = Array.isArray(parsed.extras) ? parsed.extras.filter(isTopic) : [];
    const replies = Array.isArray(parsed.replies) ? parsed.replies.filter(isReply) : [];
    return { extras, replies };
  } catch {
    return { extras: [], replies: [] };
  }
}

function isTopic(value: unknown): value is ForumTopic {
  if (!value || typeof value !== "object") return false;
  const t = value as ForumTopic;
  return Boolean(t.id && t.title && t.body && isForumBoardId(String(t.board)));
}

function isReply(value: unknown): value is ForumReply {
  if (!value || typeof value !== "object") return false;
  const r = value as ForumReply;
  return Boolean(r.id && r.topicId && r.body);
}

export function readForumDraft(storage: Pick<Storage, "getItem"> | null): ForumDraft {
  if (!storage) return EMPTY_DRAFT;
  try {
    return parseForumDraft(storage.getItem(FORUM_DRAFT_KEY));
  } catch {
    return EMPTY_DRAFT;
  }
}

export function writeForumDraft(draft: ForumDraft, storage: Pick<Storage, "setItem"> | null) {
  if (!storage) return;
  try {
    storage.setItem(FORUM_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota */
  }
}

export function allTopics(draft: ForumDraft = EMPTY_DRAFT, hiddenIds: readonly string[] = []): ForumTopic[] {
  const hidden = new Set(hiddenIds);
  return [...draft.extras, ...FORUM_SEED_TOPICS]
    .filter((topic) => !hidden.has(topic.id))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function topicsForBoard(
  board: ForumBoardId | "all",
  draft: ForumDraft = EMPTY_DRAFT,
  hiddenIds: readonly string[] = [],
): ForumTopic[] {
  const topics = allTopics(draft, hiddenIds);
  if (board === "all") return topics;
  return topics.filter((topic) => topic.board === board);
}

export function findTopic(
  id: string,
  draft: ForumDraft = EMPTY_DRAFT,
  hiddenIds: readonly string[] = [],
): ForumTopic | undefined {
  return allTopics(draft, hiddenIds).find((topic) => topic.id === id);
}

export function repliesFor(
  topicId: string,
  draft: ForumDraft = EMPTY_DRAFT,
): ForumReply[] {
  return [...FORUM_SEED_REPLIES, ...draft.replies]
    .filter((reply) => reply.topicId === topicId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export function replyCount(topicId: string, draft: ForumDraft = EMPTY_DRAFT): number {
  return repliesFor(topicId, draft).length;
}

export function boardCounts(draft: ForumDraft = EMPTY_DRAFT, hiddenIds: readonly string[] = []) {
  const topics = allTopics(draft, hiddenIds);
  return FORUM_BOARDS.map((board) => ({
    board,
    count: topics.filter((topic) => topic.board === board.id).length,
  }));
}

export function createTopic(
  board: ForumBoardId,
  title: string,
  body: string,
  draft: ForumDraft,
): { draft: ForumDraft; topic: ForumTopic } | { error: "empty" } {
  const cleanTitle = title.trim();
  const cleanBody = body.trim();
  if (!cleanTitle || !cleanBody) return { error: "empty" };
  const topic: ForumTopic = {
    id: `ft-local-${Date.now()}`,
    board,
    title: cleanTitle,
    body: cleanBody,
    author: { ...GUEST_AUTHOR },
    createdAt: new Date().toISOString(),
  };
  return { draft: { ...draft, extras: [topic, ...draft.extras] }, topic };
}

export function createReply(
  topicId: string,
  body: string,
  draft: ForumDraft,
): { draft: ForumDraft; reply: ForumReply } | { error: "empty" } {
  const clean = body.trim();
  if (!clean) return { error: "empty" };
  const reply: ForumReply = {
    id: `fr-local-${Date.now()}`,
    topicId,
    body: clean,
    author: { ...GUEST_AUTHOR },
    createdAt: new Date().toISOString(),
  };
  return { draft: { ...draft, replies: [...draft.replies, reply] }, reply };
}
