/** اسأل واحة — نص→وسائط عبر محسن فقط. بلا xAI. بلا مزود ظاهر. */

export const ASK_MEDIA_BADGE = "مولَّد بمحسن";
export const ASK_MEDIA_SOURCE = "محسن";
export const ASK_MEDIA_PROMPT_MAX = 2000;
export const ASK_MEDIA_TIMEOUT_MS = 45_000;

export const MOHSEN_MEDIA_URL = "https://ai.alhajda.com/api/media/generate";

export type AskMediaKind = "image" | "video";

export type AskMediaMime = "image/png" | "image/jpeg" | "image/webp" | "video/mp4";

export type AskMediaFailCode =
  | "bad_request"
  | "policy"
  | "policy_minor"
  | "policy_person_undress"
  | "no_provider"
  | "no_backend"
  | "upstream"
  | "unavailable"
  | "stub"
  | "empty";

export type AskMediaResult = {
  ok: true;
  kind: AskMediaKind;
  mime: AskMediaMime;
  url?: string;
  dataUrl?: string;
  source_label: typeof ASK_MEDIA_SOURCE;
  badge: typeof ASK_MEDIA_BADGE;
};

export type AskMediaFail = {
  ok: false;
  code: AskMediaFailCode;
  error: string;
};

export type AskMediaResponse = AskMediaResult | AskMediaFail;

/** جسم محسن الداخلي — لا يُمرَّر للفقاعة. */
export type MohsenMediaRaw = {
  ok?: boolean;
  success?: boolean;
  kind?: string;
  mime?: string;
  url?: string;
  error?: string;
  code?: string;
  provider?: string;
  model?: string;
};

export type MohsenMediaCall = (input: {
  kind: AskMediaKind;
  prompt: string;
}) => Promise<
  | { type: "json"; status: number; body: MohsenMediaRaw }
  | { type: "bytes"; status: number; mime: string; bytes: Uint8Array }
>;

const MINOR_RE =
  /قاصر|قاصرة|طفل(?:ة|ان|ين)?|أطفال|طفول|رضيع|رضيعة|مراهق|مراهقة|تلميذ|تلميذة|صبي(?:ة)?\s+صغير|بنت\s+صغير|ولد\s+صغير|تحت\s*الـ?\s*18|أقل\s+من\s*(?:18|١٨)|عمر(?:ه|ها)?\s*(?:1[0-7]|[1-9]|١[٠-٧]|[١-٩])\b|\bminors?\b|\bunderage\b|under\s*-?18|\bchild(?:ren)?\b|\bkids?\b|\binfant\b|\btoddler\b|\bpreteen\b|\bschoolgirl\b|\bschoolboy\b|\b(?:1[0-7]|[1-9])\s*[- ]years?\s*old/i;

const UNDRESS_RE = /تعر[ية]|عرّي|عري(?:ان)?|فك.?ملابس|undress|nude|naked|strip/i;
const IDENTIFIED_RE =
  /مرفق|مُرفق|صورته|صورتها|صورة\s+(?:هذا|هذه|الشخص)|شخص\s+حقيقي|photo\s+of|attached|this\s+person|her\s+photo|his\s+photo|real\s+person/i;

const VENDOR_RE = /fal|replicate|xai|x\.ai|grok|dall-?e|openai|cloudflare|FAL_KEY|AI Gateway|midjourney/i;

const FAIL_AR: Record<AskMediaFailCode, string> = {
  empty: "اكتب وصفاً أولاً.",
  bad_request: "الوصف غير صالح.",
  policy: "لا يمكن توليد هذا الوصف.",
  policy_minor: "لا نولّد صوراً لقاصر أو بمظهر قاصر.",
  policy_person_undress: "لا نعرّي صورة شخص حقيقي أو معرّف.",
  no_provider: "التوليد غير متاح من البيت الآن.",
  no_backend: "التوليد غير متاح من البيت الآن.",
  upstream: "تعذّر التوليد الآن.",
  unavailable: "التوليد غير متاح الآن.",
  stub: "قريباً من محسن",
};

const FAIL_EN: Record<AskMediaFailCode, string> = {
  empty: "Write a description first.",
  bad_request: "That description is not valid.",
  policy: "This description cannot be generated.",
  policy_minor: "We do not generate images of a minor, or anyone who looks like one.",
  policy_person_undress: "We will not undress a real or identified person.",
  no_provider: "House generation is not available right now.",
  no_backend: "House generation is not available right now.",
  upstream: "Generation failed just now.",
  unavailable: "Generation is unavailable right now.",
  stub: "Coming soon from Mohsen.",
};

export function mediaFailMessage(code: AskMediaFailCode, lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? FAIL_AR[code] : FAIL_EN[code];
}

export function looksLikeMinorPrompt(prompt: string): boolean {
  return MINOR_RE.test(prompt);
}

export function looksLikePersonUndress(prompt: string): boolean {
  return UNDRESS_RE.test(prompt) && IDENTIFIED_RE.test(prompt);
}

export function inspectMediaPolicy(prompt: string): AskMediaFailCode | null {
  if (looksLikeMinorPrompt(prompt)) return "policy_minor";
  if (looksLikePersonUndress(prompt)) return "policy_person_undress";
  return null;
}

export function sanitizeVisibleError(text: string, fallback: AskMediaFailCode): string {
  const trimmed = text.trim();
  if (!trimmed || VENDOR_RE.test(trimmed)) return mediaFailMessage(fallback, "ar");
  return trimmed.slice(0, 280);
}

function fail(code: AskMediaFailCode, lang: "ar" | "en" = "ar", raw?: string): AskMediaFail {
  return {
    ok: false,
    code,
    error: raw ? sanitizeVisibleError(raw, code) : mediaFailMessage(code, lang),
  };
}

function mapMohsenCode(raw: string | undefined): AskMediaFailCode {
  const code = (raw ?? "").trim().toLowerCase();
  if (code === "stub") return "stub";
  if (code === "no_backend") return "no_backend";
  if (code === "no_provider") return "no_provider";
  if (code === "upstream") return "upstream";
  if (code === "bad_request") return "bad_request";
  if (code === "unavailable") return "unavailable";
  if (code === "policy_minor") return "policy_minor";
  if (code === "policy_person_undress") return "policy_person_undress";
  if (code === "policy") return "policy";
  return "upstream";
}

function asMime(value: string | undefined, kind: AskMediaKind): AskMediaMime | null {
  const mime = (value ?? "").split(";")[0]?.trim().toLowerCase();
  if (kind === "video") {
    return mime === "video/mp4" ? "video/mp4" : null;
  }
  if (mime === "image/png") return "image/png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "image/jpeg";
  if (mime === "image/webp") return "image/webp";
  return null;
}

function bytesToDataUrl(bytes: Uint8Array, mime: AskMediaMime): string {
  const b64 = Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${b64}`;
}

function success(kind: AskMediaKind, mime: AskMediaMime, src: { url?: string; dataUrl?: string }): AskMediaResult {
  return {
    ok: true,
    kind,
    mime,
    url: src.url,
    dataUrl: src.dataUrl,
    source_label: ASK_MEDIA_SOURCE,
    badge: ASK_MEDIA_BADGE,
  };
}

function publicAssetUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function toUserMediaResult(raw: MohsenMediaRaw, kind: AskMediaKind): AskMediaResponse {
  if (raw.ok === false || raw.success === false) {
    const code = mapMohsenCode(raw.code);
    return fail(code, "ar", typeof raw.error === "string" ? raw.error : undefined);
  }
  const mime = asMime(raw.mime, kind);
  const url = publicAssetUrl(raw.url);
  if (raw.ok === true && mime && url) {
    return success(kind, mime, { url });
  }
  if (raw.ok === true && !url) {
    return fail("upstream", "ar");
  }
  const code = mapMohsenCode(raw.code);
  return fail(code, "ar", typeof raw.error === "string" ? raw.error : undefined);
}

export async function defaultAskMohsenMedia(input: {
  kind: AskMediaKind;
  prompt: string;
}): Promise<{ type: "json"; status: number; body: MohsenMediaRaw } | { type: "bytes"; status: number; mime: string; bytes: Uint8Array }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ASK_MEDIA_TIMEOUT_MS);
  try {
    const res = await fetch(MOHSEN_MEDIA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        kind: input.kind,
        prompt: input.prompt,
        source: "ask_waha",
        client: "waha",
      }),
    });
    const type = res.headers.get("content-type") ?? "";
    if (res.ok && type.startsWith("image/")) {
      return {
        type: "bytes",
        status: res.status,
        mime: type,
        bytes: new Uint8Array(await res.arrayBuffer()),
      };
    }
    if (type.includes("json")) {
      const body = (await res.json()) as MohsenMediaRaw;
      if (res.status === 404 || res.status === 501) {
        return { type: "json", status: res.status, body: { ok: false, code: "no_backend", error: body.error } };
      }
      if (res.status === 503) {
        return { type: "json", status: res.status, body: { ok: false, code: body.code || "no_backend", error: body.error } };
      }
      return { type: "json", status: res.status, body };
    }
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      return { type: "json", status: res.status, body: { ok: false, code: "no_backend" } };
    }
    return { type: "json", status: res.status, body: { ok: false, code: "upstream" } };
  } finally {
    clearTimeout(timer);
  }
}

export type RunAskMediaInput = {
  kind: AskMediaKind;
  prompt: string;
  lang?: "ar" | "en";
  askMohsenMedia?: MohsenMediaCall;
};

export async function runAskMedia(input: RunAskMediaInput): Promise<AskMediaResponse> {
  const lang = input.lang ?? "ar";
  const prompt = input.prompt.trim();
  if (!prompt) return fail("empty", lang);
  if (prompt.length > ASK_MEDIA_PROMPT_MAX) return fail("bad_request", lang);

  const policy = inspectMediaPolicy(prompt);
  if (policy) return fail(policy, lang);

  if (input.kind === "video") {
    return fail("stub", lang);
  }

  const ask = input.askMohsenMedia ?? defaultAskMohsenMedia;
  try {
    const raw = await ask({ kind: input.kind, prompt });
    if (raw.type === "bytes") {
      const mime = asMime(raw.mime, "image");
      if (!mime) return fail("upstream", lang);
      return success("image", mime, { dataUrl: bytesToDataUrl(raw.bytes, mime) });
    }
    return toUserMediaResult(raw.body, "image");
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "AbortError") return fail("unavailable", lang);
    return fail("upstream", lang);
  }
}
