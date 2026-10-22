import { validateCommand } from "./registry.ts";

export const unavailableReply =
  "محسن غير متاح الآن. ما زالت الأوامر المحلية تعمل؛ جرّب: افتح الحاسبة، كم ٢٥×٤، شغل البث";

// Mohsen's public chat contract returns prose, not a tool-selection API.
export async function requestMohsen(message: string, fetcher: typeof fetch = fetch) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const response = await fetcher("https://si.alhajda.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({ message, messages: [] }),
    });
    if (!response.ok) throw new Error("upstream");
    const result = await response.json();
    if (
      result.success === false ||
      typeof result.reply !== "string" ||
      !result.reply.trim() ||
      result.reply.length > 16000 ||
      /تعذّر المسار الداخلي|تعذر المسار الداخلي/.test(result.reply)
    )
      throw new Error("invalid reply");
    const reply = result.reply.trim();
    // Preserve compatibility with structured replies, but never execute unchecked JSON.
    const candidate = reply.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    if (/^[{[]/.test(candidate)) {
      return Response.json({ command: validateCommand(JSON.parse(candidate)) }, { headers });
    }
    return Response.json({ reply }, { headers });
  } catch {
    return Response.json({ reply: unavailableReply, unavailable: true }, { headers });
  }
}
