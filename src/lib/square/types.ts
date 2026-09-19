export type SquareAccountKind = "house" | "sample" | "you";

export type SquareDoorId = "madar" | "tahajjud" | "midad" | "sites";

export type SquareBadge = "بيت" | "عيّنة";

export type KingVisualObject = {
  frame: string;
  colors: string[];
  mood: string;
  hookLines: number;
};

export type KingVisual = string | KingVisualObject;

export type SquareAccount = {
  id: string;
  handle: string;
  nameAr: string;
  nameEn: string;
  bioAr: string;
  bioEn: string;
  kind: SquareAccountKind;
  tone: string;
  href?: string;
};

export type SquareDoor = {
  id: SquareDoorId;
  href: string;
  ar: string;
  en: string;
  hintAr: string;
  hintEn: string;
};

/** King-approved seed row — texts stay as shipped. */
export type SeedPost = {
  id: string;
  author: string;
  handle: string;
  badge: SquareBadge;
  text: string;
  visual: KingVisual;
  relativeTime: string;
  likes: number;
};

export type SquareProfile = {
  name: string;
  bio: string;
};

export type UserPost = {
  id: string;
  text: string;
  createdAt: number;
};

export type UserReply = {
  id: string;
  text: string;
  createdAt: number;
  authorName: string;
};

export type SquareLocalState = {
  version: 1;
  posts: UserPost[];
  replies: Record<string, UserReply[]>;
  likes: string[];
  echoes: string[];
  profile: SquareProfile;
};

export type FeedItem = {
  id: string;
  source: "seed" | "you";
  author: SquareAccount;
  badge?: SquareBadge;
  text: string;
  visual?: KingVisual;
  relativeTime?: string;
  createdAt: number;
  likes: number;
  echoes: number;
  liked: boolean;
  echoed: boolean;
  userReplies: UserReply[];
};

export type SquareTab = "forYou" | "following";
