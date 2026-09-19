import { useMemo } from "react";
import { usePersistent } from "@/lib/storage";
import {
  EMPTY_LOCAL,
  addPost,
  addReply,
  deleteOwnPost,
  toggleEcho,
  toggleLike,
  updateProfile,
} from "./logic.ts";
import type { SquareLocalState, SquareProfile } from "./types.ts";

export const SQUARE_STORAGE_KEY = "waha:square:v1";

export {
  EMPTY_LOCAL,
  POST_CHAR_LIMIT,
  addPost,
  addReply,
  deleteOwnPost,
  displayNameOf,
  emptyLocal,
  mergeFeed,
  toggleEcho,
  toggleLike,
  updateProfile,
  youAccount,
} from "./logic.ts";

export function useSquare() {
  const [local, setLocal, ready] = usePersistent<SquareLocalState>(SQUARE_STORAGE_KEY, EMPTY_LOCAL);

  const actions = useMemo(
    () => ({
      publish: (text: string) => setLocal((prev) => addPost(prev, text)),
      like: (id: string) => setLocal((prev) => toggleLike(prev, id)),
      echo: (id: string) => setLocal((prev) => toggleEcho(prev, id)),
      reply: (postId: string, text: string, authorName: string) => setLocal((prev) => addReply(prev, postId, text, authorName)),
      saveProfile: (profile: SquareProfile) => setLocal((prev) => updateProfile(prev, profile)),
      remove: (id: string) => setLocal((prev) => deleteOwnPost(prev, id)),
    }),
    [setLocal],
  );

  return { local, ready, ...actions };
}
