/** Read the existing monthly budget without changing or migrating saved data. */
export function monthSpent(raw: string | null, now = new Date()): number {
  if (!raw) return 0;
  try {
    const store: unknown = JSON.parse(raw);
    if (!store || typeof store !== "object" || !("month" in store) || !("items" in store)) return 0;
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (store.month !== month || !Array.isArray(store.items)) return 0;
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
