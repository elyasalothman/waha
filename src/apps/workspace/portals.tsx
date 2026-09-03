import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";

const GROUPS = [
  {
    ar: "توظيف",
    en: "Workforce",
    links: [
      { href: "https://www.qiwa.sa", ar: "قوى", en: "Qiwa" },
      { href: "https://www.hrsd.gov.sa", ar: "الموارد البشرية", en: "HRSD" },
      { href: "https://www.taqat.sa", ar: "طاقات", en: "Taqat" },
    ],
  },
  {
    ar: "زكاة وضريبة",
    en: "Zakat & tax",
    links: [{ href: "https://zatca.gov.sa", ar: "هيئة الزكاة والضريبة والجمارك", en: "ZATCA" }],
  },
  {
    ar: "تأمينات",
    en: "GOSI",
    links: [{ href: "https://www.gosi.gov.sa", ar: "التأمينات الاجتماعية", en: "GOSI" }],
  },
  {
    ar: "تجارة وسجل",
    en: "Commerce",
    links: [
      { href: "https://mc.gov.sa", ar: "وزارة التجارة", en: "Ministry of Commerce" },
      { href: "https://www.saudibusiness.gov.sa", ar: "مركز الأعمال", en: "Saudi Business Center" },
    ],
  },
  {
    ar: "وافدون وبلدي",
    en: "Residency & balady",
    links: [
      { href: "https://www.muqeem.sa", ar: "مقيم", en: "Muqeem" },
      { href: "https://www.balady.gov.sa", ar: "بلدي", en: "Balady" },
      { href: "https://www.najiz.sa", ar: "ناجز", en: "Najiz" },
    ],
  },
];

export function PortalsApp() {
  const lang = useAppStore((s) => s.lang);
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-6">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L("ابحث عن بوابة…", "Search a portal…")} />
      {GROUPS.map((g) => {
        const links = g.links.filter((l) => !n || `${l.ar} ${l.en} ${l.href}`.toLowerCase().includes(n));
        if (!links.length) return null;
        return (
          <section key={g.en}>
            <h2 className="mb-2 text-sm font-medium text-muted">{lang === "ar" ? g.ar : g.en}</h2>
            <div className="space-y-2">
              {links.map((row) => (
                <a
                  key={row.href}
                  href={row.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
                >
                  <span>{lang === "ar" ? row.ar : row.en}</span>
                  <span className="text-xs text-subtle">{new URL(row.href).host}</span>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
