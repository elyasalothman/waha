export type FamilyThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type FamilyMessage = {
  id: string;
  threadId: string;
  author: string;
  body: string;
  createdAt: number;
};

export type FamilyInbox = {
  threads: FamilyThread[];
  messages: FamilyMessage[];
};

export const FAMILY_INBOX_KEY = "waha:family-inbox";
export const DEFAULT_THREAD_ID = "family";

export function seedFamilyInbox(now = Date.now()): FamilyInbox {
  return {
    threads: [
      {
        id: DEFAULT_THREAD_ID,
        title: "العائلة",
        createdAt: now,
        updatedAt: now,
      },
    ],
    messages: [
      {
        id: "welcome",
        threadId: DEFAULT_THREAD_ID,
        author: "واحة",
        body: "صندوق العائلة على هذا الجهاز. المزامنة السحابية ليست جاهزة بعد — اكتب بصدق، والحفظ محلي.",
        createdAt: now,
      },
    ],
  };
}

export function normalizeInbox(raw: unknown, now = Date.now()): FamilyInbox {
  const seed = seedFamilyInbox(now);
  if (!raw || typeof raw !== "object") return seed;
  const rec = raw as Partial<FamilyInbox>;
  const threads = Array.isArray(rec.threads) ? rec.threads.filter(isThread) : [];
  const messages = Array.isArray(rec.messages) ? rec.messages.filter(isMessage) : [];
  if (!threads.length) return seed;
  return { threads, messages };
}

function isThread(value: unknown): value is FamilyThread {
  if (!value || typeof value !== "object") return false;
  const t = value as FamilyThread;
  return typeof t.id === "string" && typeof t.title === "string" && typeof t.createdAt === "number";
}

function isMessage(value: unknown): value is FamilyMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as FamilyMessage;
  return (
    typeof m.id === "string" &&
    typeof m.threadId === "string" &&
    typeof m.author === "string" &&
    typeof m.body === "string" &&
    typeof m.createdAt === "number"
  );
}

export function unreadCount(inbox: FamilyInbox, since: number, self: string[] = ["أنا", "Me"]) {
  const mine = new Set(self.filter(Boolean));
  return inbox.messages.filter((m) => m.createdAt > since && !mine.has(m.author)).length;
}

export function threadPreview(inbox: FamilyInbox, threadId: string) {
  const msgs = inbox.messages.filter((m) => m.threadId === threadId).sort((a, b) => b.createdAt - a.createdAt);
  return msgs[0] ?? null;
}

export type SyncStub = {
  ok: false;
  status: "stub";
  messageAr: string;
  messageEn: string;
};

export const FAMILY_SYNC_STUB: SyncStub = {
  ok: false,
  status: "stub",
  messageAr: "المزامنة السحابية ليست مفعّلة بعد. الرسائل تبقى على هذا الجهاز.",
  messageEn: "Cloud sync is not wired yet. Messages stay on this device.",
};
