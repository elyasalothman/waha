import type { Ayah } from "@/lib/daily";
import { formatHijri } from "@/lib/hijri";
import type { Lang } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { formatClock, type ShadowPrayer } from "@/lib/prayer";
import { weatherDegrees, weatherLabel, type WeatherPayload } from "@/lib/weather";

export type ShadowShare = {
  city: string;
  clock: string;
  hijri: string;
  prayerName: string;
  prayerHm: string;
  remain: string;
  weatherDeg: string;
  weatherLabel: string;
  ayah: string;
  ayahRef: string;
};

export function buildShadowShare(opts: {
  lang: Lang;
  cityName: string;
  now: Date;
  tz: string;
  prayer: ShadowPrayer;
  weather: WeatherPayload | null;
  ayah: Ayah;
}): ShadowShare {
  return {
    city: opts.cityName,
    clock: formatClock(opts.now, opts.lang, opts.tz),
    hijri: formatHijri(opts.now, opts.lang, true),
    prayerName: opts.prayer.name,
    prayerHm: opts.prayer.hm,
    remain: opts.prayer.remain,
    weatherDeg: weatherDegrees(opts.weather),
    weatherLabel: opts.weather ? weatherLabel(opts.weather.current.code, opts.lang) : "",
    ayah: opts.ayah.ar,
    ayahRef: opts.lang === "ar" ? opts.ayah.refAr : opts.ayah.refEn,
  };
}

export function shadowShareText(s: ShadowShare, lang: Lang) {
  const weather = s.weatherLabel ? `${s.weatherDeg}° ${s.weatherLabel}` : `${s.weatherDeg}°`;
  return [
    t(lang, "shadow"),
    s.city,
    s.hijri,
    `${t(lang, "now")} ${s.clock}`,
    `${t(lang, "nextPrayer")} ${s.prayerName} ${s.prayerHm}`,
    `${t(lang, "remaining")} ${s.remain}`,
    `${t(lang, "weather")} ${weather}`,
    `${t(lang, "ayah")} ${s.ayah}`,
    s.ayahRef,
  ]
    .filter((line) => line && !line.includes("—"))
    .join("\n");
}

export async function renderShadowCard(s: ShadowShare, lang: Lang): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const rtl = lang === "ar";
  ctx.fillStyle = "#0c0d0c";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#151716";
  ctx.beginPath();
  ctx.roundRect(64, 80, w - 128, h - 200, 36);
  ctx.fill();

  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  const x = rtl ? w - 120 : 120;

  const line = (text: string, y: number, size: number, color: string, font: string) => {
    ctx.fillStyle = color;
    ctx.font = font.replace("{size}", String(size));
    ctx.fillText(text, x, y, w - 240);
  };

  const display = '{size}px "Amiri", "IBM Plex Sans Arabic", serif';
  const sans = '{size}px "IBM Plex Sans Arabic", "IBM Plex Sans", sans-serif';
  const mono = '{size}px "IBM Plex Mono", ui-monospace, monospace';

  line(t(lang, "shadow"), 180, 36, "#8d938c", sans);
  line(s.city, 250, 42, "#eceee9", sans);
  line(s.hijri, 310, 28, "#8d938c", sans);
  line(s.clock, 430, 96, "#eceee9", mono);
  line(`${s.prayerName}  ${s.prayerHm}`, 560, 48, "#c5d0c4", sans);
  line(`${s.weatherDeg}°  ${s.weatherLabel}`.trim(), 640, 40, "#eceee9", mono);
  line(s.ayah, 800, 40, "#eceee9", display);
  line(s.ayahRef, 880, 26, "#8d938c", sans);
  line(t(lang, "brand"), 1220, 28, "#6a7069", sans);

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export type ShareResult = "shared" | "copied" | "image";

export async function shareShadow(s: ShadowShare, lang: Lang): Promise<ShareResult> {
  const text = shadowShareText(s, lang);
  const blob = await renderShadowCard(s, lang);
  const file =
    blob && typeof File !== "undefined"
      ? new File([blob], "waha-shadow.png", { type: "image/png" })
      : null;

  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (nav && typeof nav.share === "function") {
    try {
      const payload: ShareData = { text, title: t(lang, "shadow") };
      if (file && typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
        payload.files = [file];
      }
      await Promise.race([
        nav.share(payload),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new DOMException("share-timeout", "TimeoutError")), 2500);
        }),
      ]);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
    }
  }

  if (nav?.clipboard?.writeText) {
    await nav.clipboard.writeText(text);
  }

  if (blob && typeof document !== "undefined") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waha-shadow.png";
    a.click();
    URL.revokeObjectURL(url);
    return file ? "image" : "copied";
  }

  return "copied";
}
