import { Link, createFileRoute } from "@tanstack/react-router";
import { CitySelect } from "@/components/city-select";
import { LangSelect } from "@/components/lang-select";
import { SegmentSwitch } from "@/components/segment-switch";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { THEMES, themeTitle, type Mode, type ThemeId } from "@/lib/themes";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const mode = useAppStore((s) => s.mode);
  const fontScale = useAppStore((s) => s.fontScale);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const displayName = useAppStore((s) => s.displayName);
  const setTheme = useAppStore((s) => s.setTheme);
  const setMode = useAppStore((s) => s.setMode);
  const setFontScale = useAppStore((s) => s.setFontScale);
  const setReduceMotion = useAppStore((s) => s.setReduceMotion);
  const setDisplayName = useAppStore((s) => s.setDisplayName);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "settings")}</h1>

      <section>
        <h2 className="mb-2 text-sm text-muted">{t(lang, "yourName")}</h2>
        <input
          className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm text-muted">{t(lang, "language")}</h2>
        <LangSelect />
      </section>

      <section>
        <h2 className="mb-2 text-sm text-muted">{t(lang, "segment")}</h2>
        <SegmentSwitch />
      </section>

      <section>
        <h2 className="mb-2 text-sm text-muted">{t(lang, "city")}</h2>
        <CitySelect />
      </section>

      <section>
        <h2 className="mb-2 text-sm text-muted">{t(lang, "theme")}</h2>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id as ThemeId)}
              className={cn(
                "h-9 rounded-full border px-3 text-sm",
                theme === id ? "border-primary bg-surface-2" : "border-border bg-surface text-muted",
              )}
            >
              {themeTitle(lang, id)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm text-muted">{t(lang, "appearance")}</h2>
        <div className="flex gap-2">
          {(["dark", "light"] as Mode[]).map((id) => (
            <Button key={id} type="button" variant={mode === id ? "default" : "secondary"} onClick={() => setMode(id)}>
              {t(lang, id === "dark" ? "dark" : "light")}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm text-muted">{t(lang, "fontSize")}</h2>
        <div className="flex gap-2">
          <Button type="button" variant={fontScale === "md" ? "default" : "secondary"} onClick={() => setFontScale("md")}>
            Md
          </Button>
          <Button type="button" variant={fontScale === "lg" ? "default" : "secondary"} onClick={() => setFontScale("lg")}>
            Lg
          </Button>
        </div>
      </section>

      <section>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
          {t(lang, "reduceMotion")}
        </label>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-medium">{t(lang, "installIos")}</h2>
        <p className="mt-2 text-sm text-muted">{t(lang, "installHint")}</p>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/labs" className="text-primary">
          {t(lang, "labs")}
        </Link>
        <Link to="/admin" className="text-primary">
          {t(lang, "admin")}
        </Link>
        <Link to="/house" className="text-primary">
          {t(lang, "house")}
        </Link>
      </div>
    </div>
  );
}
