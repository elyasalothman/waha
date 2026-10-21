import { validateCommand, type AgentCommand } from "./registry";
import { SERVICES, findServices } from "../superapp";
import { CATALOG } from "../catalog";
import { calculate } from "../calculator";
import { CITIES } from "../cities";
import { fetchWeather, readWeatherCache, writeWeatherCache } from "../weather";
import { useAppStore } from "@/store/app-store";
import { useSettings } from "@/store/settings-store";
import { hideMoney, isMoneySurface } from "../child-mode";
import { normalize } from "./intents";
import type { ArabicNews } from "../arabic-news";
export type AgentResult = {
  text: string;
  links?: { label: string; href: string }[];
  undo?: () => void;
};
export async function executeCommand(
  raw: AgentCommand,
  navigate: (href: string) => Promise<unknown>,
): Promise<AgentResult> {
  const command = validateCommand(raw),
    prefs = useSettings.getState();
  const go = async (href: string, text: string) => {
    await navigate(href);
    return { text };
  };
  const open = async (id: string) => {
    if (id === "settings") return go("/settings", "تم فتح الإعدادات");
    const service = SERVICES.find((s) => s.id === id),
      app = CATALOG.find((s) => s.id === id);
    if (!service && !app) throw new Error("التطبيق غير موجود");
    if (hideMoney(useAppStore.getState().segment) && isMoneySurface(service || app!))
      throw new Error("هذه الخدمة غير متاحة في وضع الطفل");
    return go(
      service?.href || app?.href || `/app/${encodeURIComponent(id)}`,
      `تم فتح ${service?.title.ar || app?.title.ar}`,
    );
  };
  const change = (patch: Parameters<typeof prefs.update>[0]) => {
    const before = prefs.settings;
    prefs.update(patch);
    return {
      text: "تم تطبيق الإعداد وحفظه على هذا الجهاز",
      undo: () => useSettings.getState().update(before),
    };
  };
  switch (command.tool) {
    case "calculate":
      try {
        return { text: `الناتج: ${calculate(command.args.expr)}` };
      } catch {
        throw new Error("تعذّر الحساب. جرّب تعبيرًا مثل ٢٥×٤");
      }
    case "open_app":
    case "play_game":
      return open(command.args.id);
    case "search": {
      const results = findServices(command.args.q).filter(
        (s) => !hideMoney(useAppStore.getState().segment) || !isMoneySurface(s),
      );
      return {
        text: results.length ? `وجدت ${results.length} خدمات` : "لم أجد خدمة بهذا الاسم",
        links: results.slice(0, 8).map((s) => ({ label: s.title.ar, href: s.href })),
      };
    }
    case "set_theme":
      return change({ theme: command.args.theme });
    case "set_language":
      return change({ language: command.args.language });
    case "set_font_size":
      return change({ fontSize: command.args.size });
    case "set_setting":
      return change({ [command.args.key]: command.args.value });
    case "weather": {
      const city = command.args.city
        ? CITIES.find(
            (c) =>
              normalize(c.ar).includes(normalize(command.args.city!)) || c.id === command.args.city,
          )
        : useAppStore.getState().city;
      if (!city) throw new Error("لم أجد المدينة. جرّب: طقس جدة");
      let data,
        cached = false;
      try {
        data = await fetchWeather(city.lat, city.lon, AbortSignal.timeout(8000));
        writeWeatherCache(city.lat, city.lon, data);
      } catch {
        data = readWeatherCache(city.lat, city.lon);
        cached = true;
      }
      if (!data) throw new Error("تعذّر جلب الطقس الآن. افتح تطبيق الطقس وأعد المحاولة");
      const temp =
        prefs.settings.temperature === "F"
          ? (data.current.temperature * 9) / 5 + 32
          : data.current.temperature;
      return {
        text: `${city.ar}: ${Math.round(temp)}°${prefs.settings.temperature} · ${cached ? "آخر قراءة محفوظة" : "Open-Meteo · محدث"}`,
        links: [{ label: "الطقس الكامل", href: "/app/weather" }],
      };
    }
    case "news": {
      const r = await fetch("/api/news", { signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error("تعذّر جلب الأخبار");
      const data: ArabicNews = await r.json();
      const items = data.items.filter(
        (i) =>
          !command.args.topic ||
          i.title.includes(command.args.topic) ||
          i.topic.includes(command.args.topic),
      );
      if (!items.length) throw new Error("لا تتوفر عناوين لهذا الموضوع الآن");
      return {
        text: `${data.status === "cached" ? "عناوين محفوظة" : "آخر العناوين"} · راجع المصدر`,
        links: items.slice(0, 3).map((i) => ({ label: i.title, href: i.href })),
      };
    }
    case "live":
      return go("/news#live-bulletin", "تم فتح البث: موجز العناوين المسموع؛ اضغط زر التشغيل");
    case "quran":
      return go(
        `/quran?surah=${command.args.surah}&ayah=${command.args.ayah}`,
        "تم فتح السورة والآية",
      );
    case "ask_mohsen": {
      const response = await fetch("/api/mohsen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: command.args.q, messages: [] }),
        signal: AbortSignal.timeout(28000),
      });
      if (!response.ok) throw new Error("تعذّر الاتصال بمحسن. أعد المحاولة لاحقًا");
      const result = await response.json();
      if (typeof result.reply !== "string") throw new Error("تعذّر قراءة رد محسن");
      return {
        text: result.reply,
        links: [
          {
            label: "متابعة المحادثة مع محسن",
            href: `/ask?q=${encodeURIComponent(command.args.q)}`,
          },
        ],
      };
    }
    case "open_url":
      sessionStorage.setItem("waha:browser:pending", command.args.url);
      return go("/app/browser", "تم فتح الرابط داخل متصفح واحة");
    case "open_book": {
      const title = normalize(command.args.title);
      if (/مضاربة|تداول/.test(title)) return go("/books/trading-guide", "تم فتح دليل المضاربة");
      const { listPrivateBooks } = await import("../books/private/storage");
      const privateBook = await listPrivateBooks()
        .then((books) => books.find((b) => normalize(b.title).includes(title)))
        .catch(() => undefined);
      if (privateBook)
        return go(
          `/books/read/${encodeURIComponent(privateBook.id)}`,
          `تم فتح ${privateBook.title}`,
        );
      const book = SERVICES.find(
        (s) => s.href.startsWith("/books/") && normalize(s.title.ar).includes(title),
      );
      if (book) return go(book.href, `تم فتح ${book.title.ar}`);
      return { text: "اختر كتابك من الرف", links: [{ label: "رف الكتب", href: "/books" }] };
    }
    case "continue_reading": {
      const href = localStorage.getItem("waha:last-book");
      return go(
        href && /^\/books\/[a-zA-Z0-9_/-]+$/.test(href) ? href : "/books",
        href ? "عدت إلى آخر كتاب؛ يُستعاد موضعك المحفوظ" : "اختر كتابًا من رفك لبدء القراءة",
      );
    }
    case "add_note":
    case "reminder": {
      const note = command.tool === "add_note",
        key = note ? "waha:notes" : "waha:tasks";
      const previous = localStorage.getItem(key);
      const rows = JSON.parse(previous || "[]");
      if (!Array.isArray(rows)) throw new Error("تعذر قراءة القائمة الحالية");
      const id = crypto.randomUUID();
      localStorage.setItem(
        key,
        JSON.stringify([
          {
            id,
            title: command.args.text,
            ...(note
              ? { body: command.args.text, updated: Date.now() }
              : { done: false, priority: 2 }),
          },
          ...rows,
        ]),
      );
      window.dispatchEvent(new CustomEvent("waha:storage", { detail: key }));
      return {
        text: note ? "حُفظت الملاحظة محليًا" : "حُفظ التذكير في المهام، دون إشعار زمني",
        links: [{ label: "عرض القائمة", href: `/app/${note ? "notes" : "tasks"}` }],
        undo: () => {
          const current = JSON.parse(localStorage.getItem(key) || "[]");
          localStorage.setItem(
            key,
            JSON.stringify(current.filter((x: { id: string }) => x.id !== id)),
          );
          window.dispatchEvent(new CustomEvent("waha:storage", { detail: key }));
        },
      };
    }
  }
}
