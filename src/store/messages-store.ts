import { create } from "zustand";
import {
  FAMILY_INBOX_KEY,
  normalizeInbox,
  seedFamilyInbox,
  type FamilyInbox,
  type FamilyMessage,
  type FamilyThread,
} from "@/lib/messages";

type MessagesState = FamilyInbox & {
  lastReadAt: number;
  hydrate: () => void;
  compose: (title: string) => string;
  send: (threadId: string, author: string, body: string) => void;
  markRead: () => void;
};

function persist(state: FamilyInbox) {
  try {
    localStorage.setItem(FAMILY_INBOX_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  ...seedFamilyInbox(0),
  lastReadAt: 0,
  hydrate: () => {
    try {
      const raw = localStorage.getItem(FAMILY_INBOX_KEY);
      const inbox = normalizeInbox(raw ? JSON.parse(raw) : null);
      const lastReadAt = Number(localStorage.getItem("waha:family-inbox-read") ?? 0);
      set({ ...inbox, lastReadAt: Number.isFinite(lastReadAt) ? lastReadAt : 0 });
    } catch {
      set({ ...seedFamilyInbox(), lastReadAt: 0 });
    }
  },
  compose: (title) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const thread: FamilyThread = { id, title: title.trim() || "محادثة", createdAt: now, updatedAt: now };
    const next = { threads: [thread, ...get().threads], messages: get().messages };
    persist(next);
    set(next);
    return id;
  },
  send: (threadId, author, body) => {
    const text = body.trim();
    if (!text) return;
    const now = Date.now();
    const message: FamilyMessage = {
      id: crypto.randomUUID(),
      threadId,
      author: author.trim() || "أنا",
      body: text,
      createdAt: now,
    };
    const threads = get().threads.map((t) => (t.id === threadId ? { ...t, updatedAt: now } : t));
    const next = { threads, messages: [...get().messages, message] };
    persist(next);
    set(next);
  },
  markRead: () => {
    const lastReadAt = Date.now();
    try {
      localStorage.setItem("waha:family-inbox-read", String(lastReadAt));
    } catch {
      /* ignore */
    }
    set({ lastReadAt });
  },
}));
