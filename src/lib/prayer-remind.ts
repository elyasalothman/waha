import { useEffect, useState } from "react";
import { getTimes, nextPrayer, PRAYER_KEYS, prayerLabel, timesMap, type PrayerKey } from "@/lib/prayer";
import type { Lang } from "@/lib/locale";
import { t } from "@/lib/i18n";

const PREF_KEY = "waha:prayer-remind";
const QUEUE_KEY = "waha:prayer-remind-queue";
const NOTIF_BASE = 210;

export const REMIND_PRAYERS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export type RemindVia = "capacitor" | "web" | "queued" | "off";

export type RemindItem = {
  id: number;
  key: PrayerKey;
  at: number;
  title: string;
  body: string;
};

type CapNotify = {
  requestPermissions?: () => Promise<{ display?: string }>;
  schedule: (opts: {
    notifications: Array<{
      id: number;
      title: string;
      body: string;
      schedule: { at: Date };
    }>;
  }) => Promise<unknown>;
  cancel: (opts: { notifications: Array<{ id: number }> }) => Promise<unknown>;
};

function readPref(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(PREF_KEY) === "1";
  } catch {
    return false;
  }
}

function writePref(on: boolean) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PREF_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function writeQueue(items: RemindItem[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify({ at: Date.now(), items }));
  } catch {
    /* ignore */
  }
}

function readQueue(): RemindItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: RemindItem[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function capacitorNotify(): CapNotify | null {
  if (typeof window === "undefined") return null;
  const cap = (
    window as Window & {
      Capacitor?: { Plugins?: { LocalNotifications?: CapNotify } };
    }
  ).Capacitor;
  return cap?.Plugins?.LocalNotifications ?? null;
}

export function buildRemindItems(lat: number, lon: number, tz: string, lang: Lang, now = new Date()): RemindItem[] {
  const today = getTimes(lat, lon, now, tz);
  const map = timesMap(today);
  const items: RemindItem[] = [];
  for (const key of REMIND_PRAYERS) {
    const at = map[key];
    if (at.getTime() > now.getTime()) {
      items.push({
        id: NOTIF_BASE + PRAYER_KEYS.indexOf(key),
        key,
        at: at.getTime(),
        title: prayerLabel(key, lang),
        body: `${t(lang, "remindBody")} ${prayerLabel(key, lang)}`,
      });
    }
  }
  if (items.length === 0) {
    const next = nextPrayer(today, now, tz);
    items.push({
      id: NOTIF_BASE + PRAYER_KEYS.indexOf(next.key),
      key: next.key,
      at: next.at.getTime(),
      title: prayerLabel(next.key, lang),
      body: `${t(lang, "remindBody")} ${prayerLabel(next.key, lang)}`,
    });
  }
  return items;
}

async function scheduleCapacitor(plugin: CapNotify, items: RemindItem[]): Promise<boolean> {
  try {
    if (plugin.requestPermissions) {
      const perm = await plugin.requestPermissions();
      if (perm.display && perm.display !== "granted") return false;
    }
    await plugin.cancel({ notifications: REMIND_PRAYERS.map((key) => ({ id: NOTIF_BASE + PRAYER_KEYS.indexOf(key) })) });
    await plugin.schedule({
      notifications: items.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        schedule: { at: new Date(item.at) },
      })),
    });
    return true;
  } catch {
    return false;
  }
}

const webTimers = new Set<number>();

function clearWebTimers() {
  for (const id of webTimers) window.clearTimeout(id);
  webTimers.clear();
}

async function scheduleWeb(items: RemindItem[]): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") return false;
  clearWebTimers();
  for (const item of items) {
    const delay = item.at - Date.now();
    if (delay <= 0 || delay > 36 * 3600 * 1000) continue;
    const id = window.setTimeout(() => {
      new Notification(item.title, { body: item.body, tag: `waha-prayer-${item.key}` });
    }, delay);
    webTimers.add(id);
  }
  return true;
}

export async function schedulePrayerReminders(opts: {
  lat: number;
  lon: number;
  tz: string;
  lang: Lang;
}): Promise<{ ok: boolean; via: RemindVia; count: number }> {
  const items = buildRemindItems(opts.lat, opts.lon, opts.tz, opts.lang);
  writeQueue(items);

  const plugin = capacitorNotify();
  if (plugin) {
    const ok = await scheduleCapacitor(plugin, items);
    if (ok) return { ok: true, via: "capacitor", count: items.length };
  }

  const web = await scheduleWeb(items);
  if (web) return { ok: true, via: "web", count: items.length };

  return { ok: true, via: "queued", count: items.length };
}

export async function cancelPrayerReminders() {
  writeQueue([]);
  clearWebTimers();
  const plugin = capacitorNotify();
  if (plugin) {
    try {
      await plugin.cancel({
        notifications: REMIND_PRAYERS.map((key) => ({ id: NOTIF_BASE + PRAYER_KEYS.indexOf(key) })),
      });
    } catch {
      /* plugin not ready */
    }
  }
}

export async function flushQueuedReminders(opts: { lat: number; lon: number; tz: string; lang: Lang }) {
  if (!readPref()) return { ok: false, via: "off" as const, count: 0 };
  const queued = readQueue();
  const plugin = capacitorNotify();
  if (plugin && queued.length) {
    const ok = await scheduleCapacitor(plugin, queued);
    if (ok) return { ok: true, via: "capacitor" as const, count: queued.length };
  }
  return schedulePrayerReminders(opts);
}

export function usePrayerRemind(opts: { lat: number; lon: number; tz: string; lang: Lang }) {
  const [enabled, setEnabledState] = useState(false);
  const [via, setVia] = useState<RemindVia>("off");

  useEffect(() => {
    setEnabledState(readPref());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    flushQueuedReminders(opts).then((r) => {
      if (live) setVia(r.via);
    });
    return () => {
      live = false;
    };
    // primitives only — avoid looping on a new opts object each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, opts.lat, opts.lon, opts.tz, opts.lang]);

  async function setEnabled(next: boolean) {
    writePref(next);
    setEnabledState(next);
    if (next) {
      const r = await schedulePrayerReminders(opts);
      setVia(r.via);
    } else {
      await cancelPrayerReminders();
      setVia("off");
    }
  }

  return { enabled, setEnabled, via };
}
