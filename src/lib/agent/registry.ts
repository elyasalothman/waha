import { sectionIds } from "../leap-services.ts";
import surahs from "../quran-index.json" with { type: "json" };
import { z } from "zod";
import { CATALOG } from "../catalog.ts";
import { SERVICES } from "../superapp.ts";
import { settingChange } from "../settings.ts";
const text = z.string().trim().min(1).max(500);
const empty = z.object({}).strict();
const tool = <T extends z.ZodType>(description: string, schema: T, changing = false) => ({
  description,
  schema,
  changing,
});
export const registry = {
  market_quote: tool("سعر مرجعي مع المصدر والتاريخ", z.object({ symbol: text }).strict()),
  open_section: tool("افتح قسمًا من خدمات الهجدة", z.object({ id: z.enum(sectionIds) }).strict()),
  analyze_file: tool("حلّل ملفًا مرفقًا عبر محسن", empty),
  generate_image: tool("أنشئ صورة بمحسن", z.object({ prompt: text }).strict()),
  make_clip: tool("ركّب مقطعًا قصيرًا بمحسن", z.object({ prompt: text }).strict()),
  haqqiq_cv: tool("حسّن سيرتك مع حقّق", empty),
  haqqiq_interview: tool("تدرّب على المقابلة", empty),
  haqqiq_plan: tool("ضع خطة لهدفك", empty),
  ask_wiki: tool("اسأل موسوعة الهجدة", z.object({ q: text }).strict()),
  math_solve: tool("حل الرياضيات محليًا أولًا", z.object({ expr: text }).strict()),
  open_app: tool(
    "افتح تطبيقًا من كتالوج واحة",
    z
      .object({
        id: text.refine(
          (id) =>
            id === "settings" ||
            CATALOG.some((x) => x.id === id) ||
            SERVICES.some((x) => x.id === id),
        ),
      })
      .strict(),
  ),
  search: tool("ابحث في خدمات واحة", z.object({ q: text }).strict()),
  calculate: tool("احسب تعبيرًا رياضيًا", z.object({ expr: text }).strict()),
  weather: tool("طقس مدينة", z.object({ city: text.optional() }).strict()),
  news: tool("عناوين الأخبار", z.object({ topic: text.optional() }).strict()),
  live: tool("افتح الموجز المباشر المسموع", empty),
  open_book: tool("افتح كتابًا بعنوانه", z.object({ title: text }).strict()),
  continue_reading: tool("تابع آخر كتاب", empty),
  quran: tool(
    "افتح سورة وآية",
    z
      .object({
        surah: z.number().int().min(1).max(114),
        ayah: z.number().int().min(1).max(286).default(1),
      })
      .strict()
      .refine((p) => p.ayah <= (surahs[p.surah - 1]?.count || 0), "الآية خارج السورة"),
  ),
  set_theme: tool(
    "غيّر المظهر",
    z.object({ theme: z.enum(["dark", "light", "auto"]) }).strict(),
    true,
  ),
  set_language: tool("غيّر اللغة", z.object({ language: z.enum(["ar", "en"]) }).strict(), true),
  set_font_size: tool(
    "غيّر حجم خط الواجهة",
    z.object({ size: z.enum(["small", "normal", "large", "largest"]) }).strict(),
    true,
  ),
  play_game: tool(
    "افتح لعبة من الكتالوج",
    z
      .object({
        id: text.refine(
          (id) =>
            CATALOG.some((x) => x.id === id && x.category === "games") ||
            SERVICES.some((x) => x.id === id && x.pillar === "fun"),
        ),
      })
      .strict(),
  ),
  ask_mohsen: tool("اسأل محسن سؤالًا معرفيًا", z.object({ q: text }).strict()),
  add_note: tool("أضف ملاحظة محلية", z.object({ text }).strict(), true),
  reminder: tool(
    "أضف تذكيرًا إلى قائمة المهام المحلية دون إشعار",
    z.object({ text }).strict(),
    true,
  ),
  open_url: tool(
    "افتح رابط HTTPS في متصفح واحة",
    z
      .object({
        url: text.refine((s) => {
          try {
            const u = new URL(s);
            return u.protocol === "https:" && !u.username && !u.password;
          } catch {
            return false;
          }
        }),
      })
      .strict(),
    true,
  ),
  math: tool("حل رياضي محلي", z.object({ expr: text }).strict()),
  search_books: tool("ابحث في الكتب", z.object({ q: text }).strict()),
  pdf: tool(
    "استوديو PDF",
    z.object({ action: z.enum(["merge", "split", "compress", "images"]).optional() }).strict(),
  ),
  cv: tool("منشئ السيرة الذاتية", z.object({ template: text.optional() }).strict()),
  list_notes: tool("اعرض الملاحظات المحلية", empty),
  delete_note: tool("احذف ملاحظة", z.object({ id: text }).strict(), true),
  add_reminder: tool(
    "تذكير محلي بوقت الجهاز",
    z.object({ text, when: text.optional() }).strict(),
    true,
  ),
  list_reminders: tool("اعرض التذكيرات", empty),
  delete_reminder: tool("احذف تذكيرا", z.object({ id: text }).strict(), true),
  remember: tool("احفظ ذاكرة محلية", z.object({ text }).strict(), true),
  list_memory: tool("اعرض الذاكرة المحلية", empty),
  forget: tool("انس ذاكرة محلية", z.object({ text }).strict(), true),
  clear_memory: tool("امسح الذاكرة المحلية", empty, true),
  time: tool("وقت الجهاز", empty),
  hijri: tool("التاريخ الهجري", empty),
  prayer: tool("مواقيت الصلاة", empty),
  exchange: tool("تحويل العملات", z.object({ q: text }).strict()),
  set_setting: tool(
    "غيّر إعدادًا محليًا باسم الحقل وقيمته",
    z
      .object({ key: text, value: z.unknown() })
      .strict()
      .superRefine((v, ctx) => {
        try {
          settingChange(v.key, v.value);
        } catch {
          ctx.addIssue({ code: "custom", message: "إعداد أو قيمة غير صالحة" });
        }
      }),
    true,
  ),
};
export type ToolName = keyof typeof registry;
export type AgentCommand = {
  [K in ToolName]: { tool: K; args: z.infer<(typeof registry)[K]["schema"]> };
}[ToolName];
export function validateCommand(raw: unknown): AgentCommand {
  const envelope = z
    .object({
      tool: z.enum(Object.keys(registry) as [ToolName, ...ToolName[]]),
      args: z.record(z.string(), z.unknown()),
    })
    .strict()
    .parse(raw);
  return {
    tool: envelope.tool,
    args: registry[envelope.tool].schema.parse(envelope.args),
  } as AgentCommand;
}
export const toolDescriptions = Object.entries(registry).map(([name, entry]) => ({
  name,
  description: entry.description,
  parameters: z.toJSONSchema(entry.schema, { unrepresentable: "any" }),
}));

export type ToolRegistry = typeof registry;

/** External catalog destinations require the same explicit consent as open_url. */
export function requiresConfirmation(raw: AgentCommand): boolean {
  const command = validateCommand(raw);
  if (registry[command.tool].changing) return true;
  if (command.tool === "open_app" || command.tool === "play_game") {
    const href =
      SERVICES.find((item) => item.id === command.args.id)?.href ||
      CATALOG.find((item) => item.id === command.args.id)?.href;
    return Boolean(href && /^https:\/\//i.test(href));
  }
  return false;
}
