export type SquareAccountKind = "house" | "sample" | "you";

export type SquareDoorId = "madar" | "tahajjud" | "midad";

export type SquareMediaKind = "dune" | "night" | "palm" | "ink" | "mist";

export type SquarePostKind = "text" | "quote" | "door" | "media";

export type SquareAccount = {
  id: string;
  handle: string;
  nameAr: string;
  nameEn: string;
  bioAr: string;
  bioEn: string;
  kind: SquareAccountKind;
  tone: string;
};

export type SquareDoor = {
  id: SquareDoorId;
  href: string;
  appId?: string;
  ar: string;
  en: string;
  hintAr: string;
  hintEn: string;
};

export type SeedReply = {
  id: string;
  authorId: string;
  textAr: string;
  textEn: string;
  ageMinutes: number;
};

export type SeedPost = {
  id: string;
  authorId: string;
  kind: SquarePostKind;
  textAr: string;
  textEn: string;
  quoteAr?: string;
  quoteEn?: string;
  quoteAttrAr?: string;
  quoteAttrEn?: string;
  door?: SquareDoorId;
  media?: SquareMediaKind;
  ageMinutes: number;
  likes: number;
  echoes: number;
  replies?: SeedReply[];
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
  kind: SquarePostKind;
  textAr: string;
  textEn: string;
  quoteAr?: string;
  quoteEn?: string;
  quoteAttrAr?: string;
  quoteAttrEn?: string;
  door?: SquareDoor;
  media?: SquareMediaKind;
  createdAt: number;
  ageMinutes?: number;
  likes: number;
  echoes: number;
  liked: boolean;
  echoed: boolean;
  seedReplies: SeedReply[];
  userReplies: UserReply[];
};

export type SquareTab = "forYou" | "following";
