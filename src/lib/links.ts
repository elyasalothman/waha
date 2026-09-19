export type SisterApp = {
  id: string;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
  href: string;
};

export const SISTER_APPS: SisterApp[] = [
  {
    id: "tahajjud",
    title: { ar: "تهجد", en: "Tahajjud" },
    blurb: { ar: "قيام الليل", en: "Night prayer" },
    href: "https://tahajjud.alhajda.com",
  },
  {
    id: "mohsen",
    title: { ar: "محسن", en: "Mohsen" },
    blurb: { ar: "ذكاء الحجادة", en: "Alhajda AI" },
    href: "https://ai.alhajda.com",
  },
  {
    id: "luma",
    title: { ar: "لُمعة", en: "Luma" },
    blurb: { ar: "ألعاب المنظومة", en: "Suite games" },
    href: "https://games.alhajda.com",
  },
  {
    id: "hayat",
    title: { ar: "حياة", en: "Hayat" },
    blurb: { ar: "يومك خارج الواحة", en: "Life beyond Waha" },
    href: "https://hayat.alhajda.com",
  },
  {
    id: "midad",
    title: { ar: "مداد", en: "Midad" },
    blurb: { ar: "مداد الحجادة", en: "Alhajda Midad" },
    href: "https://midad.alhajda.com",
  },
  {
    id: "sites",
    title: { ar: "مواقعنا", en: "Our sites" },
    blurb: { ar: "دليل مواقع الحجادة", en: "The Alhajda sites index" },
    href: "https://alhajda.com/sites",
  },
  {
    id: "bait",
    title: { ar: "البيت", en: "Alhajda" },
    blurb: { ar: "بوابة الحجادة", en: "The house gate" },
    href: "https://alhajda.com",
  },
];

type CapacitorBrowser = {
  open: (opts: { url: string }) => Promise<void>;
};

function capacitorBrowser(): CapacitorBrowser | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: { Plugins?: { Browser?: CapacitorBrowser } } }).Capacitor;
  return cap?.Plugins?.Browser ?? null;
}

/** Open a sister surface: Capacitor Browser when present, else the system browser. */
export async function openExternal(url: string): Promise<void> {
  if (!isHttpUrl(url)) return;
  const native = capacitorBrowser();
  if (native) {
    await native.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function isHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
