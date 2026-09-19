import type { ForumBoardId } from "./boards.ts";

export type ForumAuthor = {
  id: string;
  name: string;
};

export type ForumTopic = {
  id: string;
  board: ForumBoardId;
  title: string;
  body: string;
  author: ForumAuthor;
  createdAt: string;
  seed?: boolean;
};

export type ForumReply = {
  id: string;
  topicId: string;
  body: string;
  author: ForumAuthor;
  createdAt: string;
  seed?: boolean;
};

export type ForumDraft = {
  extras: ForumTopic[];
  replies: ForumReply[];
};
