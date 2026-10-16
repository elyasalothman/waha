/** Every house card stays in Waha. Source URLs are metadata only. */
export const HOUSE_INTEGRATIONS: Readonly<Record<string, string>> = {
  tahajjud: "/worship",
  midad: "/books",
  mohsin: "/ask",
  "alhajda-tools": "/tools",
  qararak: "/compare",
  market: "/money",
  sites: "/app/sites",
  home: "/app/home",
  studio: "/app/studio",
  luma: "/app/luma",
  samar: "/app/samar",
  hayat: "/app/hayat",
  hissati: "/app/hissati",
  agent: "/app/agent",
  amlak: "/app/amlak",
  manba: "/app/manba",
  khazana: "/app/khazana",
  hudoo: "/app/hudoo",
  manteq: "/app/manteq",
  himaya: "/app/himaya",
};

export function internalHouseHref(href: string): string | undefined {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    const ids: Record<string, string> = {
      "alhajda.com": "home",
      "hajdah.com": "studio",
      "tahajjud.alhajda.com": "tahajjud",
      "midad.alhajda.com": "midad",
      "ai.alhajda.com": "mohsin",
      "tools.alhajda.com": "alhajda-tools",
      "games.alhajda.com": "luma",
      "luma.alhajda.com": "samar",
    };
    if (host === "alhajda.com" && new URL(href).pathname.startsWith("/sites")) return "/app/sites";
    const id = ids[host] ?? (host.endsWith(".alhajda.com") ? host.split(".")[0] : "");
    return HOUSE_INTEGRATIONS[id];
  } catch {
    return undefined;
  }
}
