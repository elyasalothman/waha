import type { ForumReply, ForumTopic } from "./types.ts";

const HOUSE: ForumTopic["author"] = { id: "waha", name: "واحة" };

function t(
  id: string,
  board: ForumTopic["board"],
  title: string,
  body: string,
  hoursAgo: number,
): ForumTopic {
  return {
    id,
    board,
    title,
    body,
    author: HOUSE,
    createdAt: new Date(Date.UTC(2026, 8, 18, 12) - hoursAgo * 3600_000).toISOString(),
    seed: true,
  };
}

function r(id: string, topicId: string, body: string, hoursAgo: number, name = "ضيف هادئ"): ForumReply {
  return {
    id,
    topicId,
    body,
    author: { id: `guest-${id}`, name },
    createdAt: new Date(Date.UTC(2026, 8, 18, 16) - hoursAgo * 3600_000).toISOString(),
    seed: true,
  };
}

/** Twelve calm Arabic topics, two per fixed board. Not the Maydan timeline. */
export const FORUM_SEED_TOPICS: readonly ForumTopic[] = [
  t("ft-g1", "general", "مرحباً في ساحة النقاش", "هذه الساحة للنقاش الطويل الهادئ. الميدان للسطر القصير، وهنا نفتح موضوعاً ونرد عليه.", 40),
  t("ft-g2", "general", "كيف ترتّبون صباحكم بلا عجلة؟", "ما أول عمل تهدأ به بعد الفجر؟ كوب ماء، ورد قصير، أو مشي إلى الباب.", 36),
  t("ft-s1", "science", "قراءة هادئة في الفلك", "هل عندكم كتاب عربي مبسّط عن القمر والمنازل يناسب المساء، من غير ضجيج الأرقام؟", 33),
  t("ft-s2", "science", "مصادر علوم بلا استعجال", "أبحث عن قناة أو موقع عربي يشرح الطقس أو النبات بجمل قصيرة. ما الذي اطمأننتم إليه؟", 28),
  t("ft-d1", "deen", "ورد خفيف بعد العشاء", "ما الورد الذي يثبت عندكم إذا طال اليوم؟ صفحة، أو أذكار لا تثقل.", 30),
  t("ft-d2", "deen", "كتاب تأنستم به في السيرة", "إن كان عندكم كتاب سيرة تقرأون منه صفحة قبل النوم، اذكروا عنوانه من غير إطالة.", 22),
  t("ft-l1", "life", "عادة صغيرة تغيّر المساء", "أطفىء الشاشات قبل الأذان بربع ساعة. هل عندكم عادة بهذا الحجم؟", 26),
  t("ft-l2", "life", "مشي قصير بعد المغرب", "دائرة حول الحي تكفي. كيف تجعلون المشي ثابتاً في الحر أو في برد أول الشتاء؟", 18),
  t("ft-c1", "code", "مشروع شخصي صغير بلا موعد", "أداة واحدة على الجهاز، بلا حساب. ما الذي بنيتموه لأنفسكم هذا العام؟", 20),
  t("ft-c2", "code", "أدوات محلية تفضّلونها", "محرّر، مفكرة، أو مفهرس ملفات يبقى معكم بلا سحابة. ما الذي بقي بعد التجربة؟", 14),
  t("ft-i1", "ideas", "فكرة واحة هادئة", "إن بقي في الواحة باب واحد فوق الصلاة والماء، ماذا تضيفون؟ لا قائمة طويلة.", 12),
  t("ft-i2", "ideas", "ما الذي تستغنون عنه في الشاشات؟", "إشعار، تطبيق، أو عادة فتح لا تعودون إليها. اذكروا واحدة.", 8),
];

export const FORUM_SEED_REPLIES: readonly ForumReply[] = [
  r("fr-g1a", "ft-g1", "واضح الفرق: الميدان للمرور، والمنتدى للجلوس.", 38),
  r("fr-g2a", "ft-g2", "ماء ثم آية قصيرة. لا أفتح الجوال حتى تطلع الشمس.", 34, "نورة"),
  r("fr-s1a", "ft-s1", "«منازل القمر» لابن قتيبة ثقيل للمساء. جربوا مقالاً قصيراً في مجلة العربي.", 31),
  r("fr-d1a", "ft-d1", "ثلاثة استغفار بعد العشاء يكفي إن طال النهار.", 27, "سعد"),
  r("fr-l1a", "ft-l1", "أغلق المطبخ قبل الشاشات. البيت يهدأ أسرع.", 24),
  r("fr-c1a", "ft-c1", "دفتر مصروف في ملف واحد. لا تطبيق.", 16, "ليان"),
  r("fr-i2a", "ft-i2", "إشعارات المتاجر. لم أفتقدها.", 6),
];

export function forumSeedTopicCount(): number {
  return FORUM_SEED_TOPICS.length;
}
