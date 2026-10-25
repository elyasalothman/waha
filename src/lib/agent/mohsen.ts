import { validateCommand } from "./registry.ts";

export const unavailableReply =
  "محسن غير متاح الآن. ما زالت الأوامر المحلية تعمل؛ جرّب: افتح الحاسبة، كم ٢٥×٤، شغل البث";

export type Citation = { url: string; title: string };
export function parseMohsenReply(raw: unknown) {
  if (!raw || typeof raw !== "object") throw new Error("invalid reply");
  const result = raw as Record<string, unknown>;
  if (
    result.success === false ||
    typeof result.reply !== "string" ||
    !result.reply.trim() ||
    result.reply.length > 16000 ||
    /تعذّر المسار الداخلي|تعذر المسار الداخلي/.test(result.reply)
  )
    throw new Error("invalid reply");
  const citations: Citation[] = [];
  if (Array.isArray(result.citations))
    for (const item of result.citations.slice(0, 20)) {
      if (!item || typeof item.url !== "string") continue;
      try {
        const url = new URL(item.url);
        if (url.protocol === "https:" && !url.username && !url.password)
          citations.push({
            url: url.href,
            title: typeof item.title === "string" ? item.title.slice(0, 300) : url.hostname,
          });
      } catch {
        /* ignore invalid citation */
      }
    }
  return {
    reply: result.reply.trim(),
    citations,
    verified: citations.length > 0,
    source: typeof result.source === "string" ? result.source.slice(0, 500) : undefined,
    evidence:
      typeof result.evidence === "string"
        ? result.evidence.slice(0, 2000)
        : result.evidence &&
            typeof result.evidence === "object" &&
            "label" in result.evidence &&
            typeof result.evidence.label === "string"
          ? result.evidence.label.slice(0, 2000)
          : undefined,
  };
}
// The remote reply is evidence-bearing prose; only the local planner selects actions.
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
    const parsed = parseMohsenReply(result);
    return Response.json(
      {
        reply,
        ...(Array.isArray(result.citations)
          ? { citations: parsed.citations, verified: parsed.verified }
          : {}),
        ...(parsed.source ? { source: parsed.source } : {}),
        ...(parsed.evidence ? { evidence: parsed.evidence } : {}),
      },
      { headers },
    );
  } catch {
    return Response.json({ reply: unavailableReply, unavailable: true }, { headers });
  }
}
