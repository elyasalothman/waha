export const FEATURE_IDS = [
  "weather",
  "faith",
  "messages",
  "ask",
  "money",
  "settings",
  "games",
  "work",
  "tools",
  "life",
  "sisters",
  "tahajjud",
  "midad",
  "sites",
] as const;

export type FeatureId = (typeof FEATURE_IDS)[number];
export type FeatureLane = "core" | "system" | "labs";

/** Alhajda doors the Feature Store can hide. Door UI stays in `doors.ts`. */
export const DOOR_FEATURE_IDS = ["tahajjud", "midad", "sites"] as const;
export type DoorFeatureId = (typeof DOOR_FEATURE_IDS)[number];

export function isDoorFeatureId(id: string): id is DoorFeatureId {
  return (DOOR_FEATURE_IDS as readonly string[]).includes(id);
}

export type FeatureDef = {
  id: FeatureId;
  lane: FeatureLane;
  defaultOn: boolean;
  locked?: boolean;
  elevated?: boolean;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
};

export const FEATURES: FeatureDef[] = [
  {
    id: "weather",
    lane: "core",
    defaultOn: true,
    title: { ar: "الطقس", en: "Weather" },
    blurb: { ar: "حرارة وساعة ويوم لمدينتك", en: "Current, hourly, and daily for your city" },
  },
  {
    id: "faith",
    lane: "core",
    defaultOn: true,
    title: { ar: "إيمان", en: "Faith" },
    blurb: { ar: "صلاة وأذكار وقبلة", en: "Prayer, athkar, and qibla" },
  },
  {
    id: "messages",
    lane: "core",
    defaultOn: true,
    title: { ar: "رسائل", en: "Messages" },
    blurb: { ar: "صندوق العائلة على الجهاز", en: "Family inbox on this device" },
  },
  {
    id: "ask",
    lane: "core",
    defaultOn: true,
    title: { ar: "اسأل", en: "Ask" },
    blurb: { ar: "واحة للذكاء — محادثة وكتابة", en: "Waha AI — chat and writing" },
  },
  {
    id: "money",
    lane: "core",
    defaultOn: true,
    title: { ar: "مال", en: "Money" },
    blurb: { ar: "مصروف وزكاة وحسابات", en: "Spend, zakat, and ledgers" },
  },
  {
    id: "settings",
    lane: "system",
    defaultOn: true,
    locked: true,
    title: { ar: "إعدادات", en: "Settings" },
    blurb: { ar: "الملف ومتجر الميزات", en: "Profile and the Feature Store" },
  },
  {
    id: "games",
    lane: "labs",
    defaultOn: true,
    title: { ar: "الترفيه", en: "Play" },
    blurb: { ar: "بلوت واستراحة — خارج الشاشة الأولى", en: "Baloot and a break — off the first screen" },
  },
  {
    id: "work",
    lane: "labs",
    defaultOn: true,
    title: { ar: "عمل", en: "Work" },
    blurb: { ar: "مكتب المنشأة: عملاء وفواتير", en: "The firm desk: clients and invoices" },
  },
  {
    id: "tools",
    lane: "labs",
    defaultOn: true,
    title: { ar: "أدوات", en: "Tools" },
    blurb: { ar: "حاسبات يومية وتفقيط", en: "Everyday calculators and tafqeet" },
  },
  {
    id: "life",
    lane: "labs",
    defaultOn: true,
    title: { ar: "حياتك", en: "Life catalog" },
    blurb: { ar: "كل خدمات الأفراد في مكتبة هادئة", en: "Every personal service, in a quiet library" },
  },
  {
    id: "sisters",
    lane: "labs",
    defaultOn: true,
    elevated: true,
    title: { ar: "منظومة الحجادة", en: "Alhajda suite" },
    blurb: { ar: "تهجد ومحسن ولُمعة وحياة والبيت", en: "Tahajjud, Mohsen, Luma, Hayat, and Alhajda" },
  },
  {
    id: "tahajjud",
    lane: "labs",
    defaultOn: true,
    elevated: true,
    title: { ar: "تهجد", en: "Tahajjud" },
    blurb: { ar: "tahajjud.alhajda.com", en: "tahajjud.alhajda.com" },
  },
  {
    id: "midad",
    lane: "labs",
    defaultOn: true,
    elevated: true,
    title: { ar: "مداد", en: "Midad" },
    blurb: { ar: "midad.alhajda.com", en: "midad.alhajda.com" },
  },
  {
    id: "sites",
    lane: "labs",
    defaultOn: true,
    elevated: true,
    title: { ar: "مواقعنا", en: "Our sites" },
    blurb: { ar: "alhajda.com/sites", en: "alhajda.com/sites" },
  },
];

export type FeatureMap = Record<FeatureId, boolean>;

export function defaultFeatures(): FeatureMap {
  return Object.fromEntries(FEATURES.map((f) => [f.id, f.defaultOn])) as FeatureMap;
}

export function normalizeFeatures(raw: unknown): FeatureMap {
  const next = defaultFeatures();
  if (!raw || typeof raw !== "object") return next;
  const rec = raw as Record<string, unknown>;
  for (const id of FEATURE_IDS) {
    const def = FEATURES.find((f) => f.id === id);
    if (def?.locked) {
      next[id] = true;
      continue;
    }
    if (typeof rec[id] === "boolean") next[id] = rec[id];
  }
  return next;
}

export function isFeatureOn(flags: FeatureMap, id: FeatureId) {
  if (id === "settings") return true;
  return flags[id] !== false;
}

export function featuresByLane(lane: FeatureLane) {
  return FEATURES.filter((f) => f.lane === lane);
}

export function elevatedLabs() {
  return FEATURES.filter((f) => f.lane === "labs" && f.elevated);
}

export function doorFeatures() {
  return FEATURES.filter((f) => isDoorFeatureId(f.id));
}
