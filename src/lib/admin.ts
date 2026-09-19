const PIN_KEY = "waha:admin-pin";
const SESSION_KEY = "waha:admin-session";

async function digest(pin: string) {
  const data = new TextEncoder().encode(`waha-admin:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hasPin() {
  try {
    return Boolean(localStorage.getItem(PIN_KEY));
  } catch {
    return false;
  }
}

export function isUnlocked() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export async function setPin(pin: string) {
  const hash = await digest(pin);
  localStorage.setItem(PIN_KEY, hash);
  sessionStorage.setItem(SESSION_KEY, "1");
}

export async function unlock(pin: string) {
  const hash = await digest(pin);
  const stored = localStorage.getItem(PIN_KEY);
  if (stored !== hash) return false;
  sessionStorage.setItem(SESSION_KEY, "1");
  return true;
}

export function lockAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function exportBackup() {
  const dump: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    dump[k] = localStorage.getItem(k) ?? "";
  }
  return JSON.stringify({ v: 1, at: Date.now(), dump }, null, 2);
}

export function importBackup(raw: string) {
  const parsed = JSON.parse(raw) as { dump?: Record<string, string> };
  if (!parsed.dump) throw new Error("bad backup");
  for (const [k, v] of Object.entries(parsed.dump)) {
    localStorage.setItem(k, v);
  }
}

export function resetWaha() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("waha")) keys.push(k);
  }
  for (const k of keys) localStorage.removeItem(k);
  sessionStorage.removeItem(SESSION_KEY);
}

export function counts() {
  let tasks = 0;
  let spend = 0;
  try {
    const rawTasks = localStorage.getItem("waha:tasks") ?? localStorage.getItem("waha-tasks");
    if (rawTasks) {
      const parsed = JSON.parse(rawTasks) as unknown;
      tasks = Array.isArray(parsed) ? parsed.length : 0;
    }
    const rawSpend = localStorage.getItem("waha:expenses") ?? localStorage.getItem("waha-budget");
    if (rawSpend) {
      const parsed = JSON.parse(rawSpend) as unknown;
      spend = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {
    /* ignore */
  }
  return { tasks, spend, keys: localStorage.length };
}
