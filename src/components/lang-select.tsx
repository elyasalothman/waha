import { LANGS, LANG_META, type Lang } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function LangSelect({ compact = false }: { compact?: boolean }) {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);

  return (
    <label className={cn("flex items-center gap-2", compact && "min-w-0")}>
      <span className="sr-only">{t(lang, "language")}</span>
      <select
        className="h-11 min-w-11 rounded-md border border-border bg-surface px-2 text-sm text-fg"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
      >
        {LANGS.map((id) => (
          <option key={id} value={id}>
            {LANG_META[id].native}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LangToggle({ lang: _lang }: { lang: Lang }) {
  return <LangSelect compact />;
}
