export const MOHSEN_MESSAGE_LIMIT = 8000;
export const MOHSEN_BODY_LIMIT = 128000;
/** Bound conversation context separately from the current question. */
export function mohsenHistory(value: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(value)) return [];
  let remaining = 12000;
  const result: { role: "user" | "assistant"; content: string }[] = [];
  for (const entry of value.slice(-8).reverse()) {
    if (!entry || !["user", "assistant"].includes(entry.role) || typeof entry.content !== "string")
      continue;
    const content = entry.content.slice(0, Math.min(4000, remaining));
    if (content) result.unshift({ role: entry.role, content });
    remaining -= content.length;
    if (!remaining) break;
  }
  return result;
}
