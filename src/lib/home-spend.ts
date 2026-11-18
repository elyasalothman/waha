/** Read the existing monthly budget without changing or migrating saved data. */
export function monthSpent(raw: string | null, now = new Date()): number {
  if (!raw) return 0;
  try {
    const store: unknown = JSON.parse(raw);
    if (!store || typeof store !== "object") return 0;
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if ("version" in store && store.version === 1 && "entries" in store && Array.isArray(store.entries)) {
      return store.entries.reduce((sum: number, item: unknown) => {
        if (!item || typeof item !== "object") return sum;
        const row = item as { kind?: unknown; amount?: unknown; on?: unknown };
        if (row.kind !== "expense" || typeof row.on !== "string" || !row.on.startsWith(month)) return sum;
        return typeof row.amount === "number" && Number.isFinite(row.amount) && row.amount > 0 ? sum + row.amount : sum;
      }, 0);
    }
    if (!("month" in store) || !("items" in store) || store.month !== month || !Array.isArray(store.items)) return 0;
    return store.items.reduce((sum: number, item: unknown) => {
      if (!item || typeof item !== "object" || !("amount" in item)) return sum;
      return typeof item.amount === "number" && Number.isFinite(item.amount) && item.amount > 0
        ? sum + item.amount
        : sum;
    }, 0);
  } catch {
    return 0;
  }
}
