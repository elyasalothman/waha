import { useMemo, useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";

type Link = { href: string; ar: string; en: string; group: "gov" | "id" | "health" | "home" | "money" | "learn" };

const GROUPS: { id: Link["group"]; ar: string; en: string }[] = [
  { id: "gov", ar: "حكومة", en: "Government" },
  { id: "id", ar: "هوية وتنقل", en: "ID & travel" },
  { id: "health", ar: "صحة", en: "Health" },
  { id: "home", ar: "منزل وبلدية", en: "Home & city" },
  { id: "money", ar: "مال وزكاة", en: "Money" },
  { id: "learn", ar: "تعليم وعمل", en: "Study & work" },
];

const LINKS: Link[] = [
  { href: "https://www.my.gov.sa", ar: "منصة حكومي", en: "National portal", group: "gov" },
  { href: "https://www.iam.gov.sa", ar: "نفاذ", en: "Nafath", group: "gov" },
  { href: "https://www.tawakkalna.gov.sa", ar: "توكلنا", en: "Tawakkalna", group: "gov" },
  { href: "https://www.najiz.sa", ar: "ناجز — العدل", en: "Najiz — Justice", group: "gov" },
  { href: "https://www.ehsan.sa", ar: "إحسان", en: "Ehsan", group: "gov" },
  { href: "https://www.absher.sa", ar: "أبشر", en: "Absher", group: "id" },
  { href: "https://www.muqeem.sa", ar: "مقيم", en: "Muqeem", group: "id" },
  { href: "https://www.moh.gov.sa", ar: "وزارة الصحة", en: "Ministry of Health", group: "health" },
  { href: "https://www.sehhaty.sa", ar: "صحتي", en: "Sehhaty", group: "health" },
  { href: "https://www.se.com.sa", ar: "الشركة السعودية للكهرباء", en: "Saudi Electricity", group: "home" },
  { href: "https://www.nwc.com.sa", ar: "المياه الوطنية", en: "National Water", group: "home" },
  { href: "https://www.splonline.com.sa", ar: "سبل — البريد", en: "SPL — Post", group: "home" },
  { href: "https://www.balady.gov.sa", ar: "بلدي", en: "Balady", group: "home" },
  { href: "https://zatca.gov.sa", ar: "هيئة الزكاة والضريبة", en: "ZATCA", group: "money" },
  { href: "https://www.gosi.gov.sa", ar: "التأمينات الاجتماعية", en: "GOSI", group: "money" },
  { href: "https://www.stats.gov.sa", ar: "الهيئة العامة للإحصاء", en: "GASTAT", group: "money" },
  { href: "https://www.moe.gov.sa", ar: "وزارة التعليم", en: "Ministry of Education", group: "learn" },
  { href: "https://www.hrsd.gov.sa", ar: "الموارد البشرية", en: "HRSD", group: "learn" },
  { href: "https://www.qiwa.sa", ar: "قوى", en: "Qiwa", group: "learn" },
];

export function ServicesApp() {
  const lang = useAppStore((s) => s.lang);
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      LINKS.filter((row) =>
        !needle
          ? true
          : [row.ar, row.en, row.href].some((s) => s.toLowerCase().includes(needle)),
      ),
    [needle],
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {lang === "ar"
          ? "روابط رسمية تُفتح خارج واحة (متصفح النظام على الآيفون). ليست بديلاً عن المنصة نفسها."
          : "Official links open outside Waha (system browser on iPhone). Not a substitute for the portal itself."}
      </p>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === "ar" ? "ابحث: أبشر، ناجز، صحتي…" : "Search: Absher, Najiz, Sehhaty…"} />
      {GROUPS.map((g) => {
        const rows = filtered.filter((r) => r.group === g.id);
        if (!rows.length) return null;
        return (
          <section key={g.id}>
            <h2 className="mb-2 text-sm font-medium text-muted">{lang === "ar" ? g.ar : g.en}</h2>
            <div className="space-y-2">
              {rows.map((row) => (
                <ExternalLink
                  key={row.href}
                  href={row.href}
                  className="flex min-h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
                >
                  <span>{lang === "ar" ? row.ar : row.en}</span>
                  <span className="text-xs text-subtle">{new URL(row.href).host}</span>
                </ExternalLink>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
