import { Link, createFileRoute } from "@tanstack/react-router";
import { appIcon } from "@/lib/icons";
import { CATALOG } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

const FAITH_IDS = ["salah", "salahlog", "athkar", "qibla", "dua", "asma", "khatma", "tasbih"];

export const Route = createFileRoute("/faith")({ component: FaithPage });

function FaithPage() {
  const lang = useAppStore((s) => s.lang);
  const items = FAITH_IDS.map((id) => CATALOG.find((a) => a.id === id)).filter((x): x is NonNullable<typeof x> => x != null);

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs tracking-wide text-muted">{t(lang, "faith")}</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "faith")}</h1>
      <p className="mt-3 text-sm text-muted">{t(lang, "faithBlurb")}</p>
      <ul className="mt-8 space-y-2">
        {items.map((item) => {
          const Icon = appIcon(item.icon);
          return (
            <li key={item.id}>
              <Link
                to="/app/$id"
                params={{ id: item.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-primary">
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <span>
                  <span className="block font-medium">{item.title[lang]}</span>
                  <span className="block text-xs text-muted">{item.blurb[lang]}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
