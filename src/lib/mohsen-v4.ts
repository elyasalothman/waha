/** Direct browser calls preserve per-visitor quotas. No identifiers or conversation archive. */
export const MOHSEN_ORIGIN = "https://si.alhajda.com";
export const CHAT_KEY = "waha:mohsen:threads:v2";
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: { url: string; title: string }[];
  verified?: boolean;
  label?: string;
  image?: string;
  slides?: string[];
  video?: string;
  vote?: string;
};
export type ChatThread = { id: string; title: string; messages: ChatMessage[] };
export function readThreads(raw: string | null): ChatThread[] {
  try {
    const rows: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(rows)) return [];
    return rows
      .slice(0, 20)
      .filter(
        (t): t is ChatThread =>
          !!t &&
          typeof t.id === "string" &&
          typeof t.title === "string" &&
          Array.isArray(t.messages),
      )
      .map((t) => ({
        ...t,
        title: t.title.slice(0, 80),
        messages: t.messages
          .filter(
            (m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string",
          )
          .slice(-60)
          .map((m) => ({
            role: m.role,
            content: m.content.slice(0, 16000),
            label: typeof m.label === "string" ? m.label : undefined,
            citations: Array.isArray(m.citations)
              ? m.citations
                  .filter((c) => c && safeSource(c.url) && typeof c.title === "string")
                  .slice(0, 20)
              : [],
            verified: m.verified === true,
            vote: m.vote,
          })),
      }));
  } catch {
    return [];
  }
}
export function safeSource(url: unknown): url is string {
  try {
    const u = new URL(String(url));
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function serviceError(status: number) {
  return status === 429
    ? "وصلت الحصة أو ازدحمت الخدمة؛ انتظر قليلًا أو جرّب غدًا."
    : status === 403
      ? "تعذّر السماح بالطلب من واحة؛ يمكنك فتح محسن مباشرة."
      : status === 413
        ? "الملف أكبر من 10 ميجابايت."
        : status === 415
          ? "نوع الملف غير مدعوم. أرسل صورة أو PDF أو DOCX أو XLSX أو TXT أو CSV."
          : status >= 500
            ? "محسن مشغول الآن؛ أعد المحاولة بعد قليل."
            : "تعذّر إكمال الطلب؛ راجع المدخلات وأعد المحاولة.";
}
export function validateUpload(file: Pick<File, "size" | "name">) {
  if (!Number.isFinite(file.size) || file.size <= 0) throw new Error("الملف فارغ.");
  if (file.size > 10 * 1024 * 1024) throw new Error(serviceError(413));
  if (!/\.(png|jpe?g|webp|pdf|docx|xlsx|txt|csv|md|json)$/i.test(file.name))
    throw new Error(serviceError(415));
}
export async function mmRequest(
  path: string,
  body?: object | FormData,
  signal?: AbortSignal,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(MOHSEN_ORIGIN + path, {
      method: body ? "POST" : "GET",
      credentials: "omit",
      cache: "no-store",
      ...(body instanceof FormData
        ? { body }
        : body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      signal: signal || AbortSignal.timeout(90000),
    });
  } catch (e) {
    if (signal?.aborted) throw new Error("توقف الطلب.");
    throw new Error(
      e instanceof Error && e.name === "TimeoutError"
        ? "طال انتظار محسن؛ أعد المحاولة."
        : "تعذّر الاتصال؛ تحقق من الإنترنت ثم أعد المحاولة.",
    );
  }
  if (!response.ok) throw new Error(serviceError(response.status));
  return response;
}
export async function composeClip(images: string[], signal: AbortSignal): Promise<string | null> {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported("video/webm"))
    return null;
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 768;
  if (!canvas.captureStream) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const pictures = await Promise.all(
    images.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("تعذّر تركيب الصور"));
          img.src = src;
        }),
    ),
  );
  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks: BlobPart[] = [];
  return new Promise((resolve, reject) => {
    let frame = 0;
    let raf = 0;
    const cleanup = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      if (recorder.state !== "inactive") recorder.stop();
      cleanup();
      reject(new Error("توقف الطلب."));
    };
    signal.addEventListener("abort", abort, { once: true });
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onerror = () => {
      cleanup();
      resolve(null);
    };
    recorder.onstop = () => {
      cleanup();
      resolve(URL.createObjectURL(new Blob(chunks, { type: "video/webm" })));
    };
    recorder.start();
    const draw = () => {
      if (signal.aborted) {
        abort();
        return;
      }
      const img = pictures[Math.min(Math.floor(frame / 72), pictures.length - 1)];
      const scale = Math.max(768 / img.width, 768 / img.height) * (1 + (frame % 72) / 720);
      ctx.drawImage(
        img,
        (768 - img.width * scale) / 2,
        (768 - img.height * scale) / 2,
        img.width * scale,
        img.height * scale,
      );
      frame++;
      if (frame >= pictures.length * 72) recorder.stop();
      else raf = requestAnimationFrame(draw);
    };
    draw();
  });
}
