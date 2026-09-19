export const FORUM_BOARD_IDS = ["general", "science", "deen", "life", "code", "ideas"] as const;

export type ForumBoardId = (typeof FORUM_BOARD_IDS)[number];

export type ForumBoard = {
  id: ForumBoardId;
  slug: ForumBoardId;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
};

export const FORUM_BOARDS: readonly ForumBoard[] = [
  { id: "general", slug: "general", title: { ar: "عام", en: "General" }, blurb: { ar: "حديث هادئ لا يخص قسماً بعينه", en: "Calm talk that belongs nowhere else" } },
  { id: "science", slug: "science", title: { ar: "علم", en: "Science" }, blurb: { ar: "أسئلة وقراءات بلا ضجيج", en: "Quiet questions and reading" } },
  { id: "deen", slug: "deen", title: { ar: "دين", en: "Faith" }, blurb: { ar: "ورد وسيرة على مهلك", en: "Wird and sira, unhurried" } },
  { id: "life", slug: "life", title: { ar: "حياة", en: "Life" }, blurb: { ar: "عادات البيت والمساء", en: "Home habits and evenings" } },
  { id: "code", slug: "code", title: { ar: "برمجة", en: "Code" }, blurb: { ar: "مشاريع صغيرة وأدوات محلية", en: "Small projects and local tools" } },
  { id: "ideas", slug: "ideas", title: { ar: "أفكار", en: "Ideas" }, blurb: { ar: "خواطر بلا استعجال", en: "Unhurried notes" } },
];

export function isForumBoardId(value: string): value is ForumBoardId {
  return (FORUM_BOARD_IDS as readonly string[]).includes(value);
}

export function getForumBoard(id: string): ForumBoard | undefined {
  return FORUM_BOARDS.find((b) => b.id === id);
}
