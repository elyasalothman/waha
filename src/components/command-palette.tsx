import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { BooksMark, ClipsMark, MadarMark } from "@/components/brand";
import { searchCatalog } from "@/lib/catalog";
import { hideMoney, isMoneySurface } from "@/lib/child-mode";
import { appIcon } from "@/lib/icons";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";
import { openExternalUrl } from "@/lib/native-browser";

export function CommandPalette({
  open,
  onOpenChange,
  lang,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lang: Lang;
}) {
  const navigate = useNavigate();
  const audience = useAppStore((s) => s.audience);
  const segment = useAppStore((s) => s.segment);
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const found = searchCatalog(q, audience);
    return hideMoney(segment) ? found.filter((item) => !isMoneySurface(item)) : found;
  }, [q, audience, segment]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <Command
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-(--shadow-soft)"
        label={t(lang, "search")}
      >
        <Command.Input
          autoFocus
          value={q}
          onValueChange={setQ}
          placeholder={t(lang, "search")}
          dir={lang === "ar" ? "rtl" : "ltr"}
          lang={lang === "ar" ? "ar" : "en"}
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm text-fg outline-none placeholder:text-subtle"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted">{t(lang, "empty")}</Command.Empty>
          {q.trim() ? (
            <Command.Item
              value={`مدار madar ${q} ${t(lang, "madarSearchAction")}`}
              onSelect={() => {
                onOpenChange(false);
                void navigate({ to: "/madar", search: { q: q.trim() } });
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-fg data-[selected=true]:bg-surface-2",
              )}
            >
              <MadarMark className="size-4" />
              <span className="flex-1">{t(lang, "madarSearchAction")}</span>
              <span className="truncate text-xs text-subtle">{q.trim()}</span>
            </Command.Item>
          ) : null}
          {items.map((item) => {
            const Icon =
              item.id === "madar" ? MadarMark : item.id === "clips" ? ClipsMark : item.id === "midad" ? BooksMark : appIcon(item.icon);
            return (
              <Command.Item
                key={item.id}
                value={`${item.title.ar} ${item.title.en} ${item.id}`}
                onSelect={() => {
                  onOpenChange(false);
                  if (item.portal && item.id === "madar") {
                    void navigate({ to: "/madar" });
                    return;
                  }
                  if (item.portal && item.id === "clips") {
                    void navigate({ to: "/clips" });
                    return;
                  }
                  if (item.portal && item.id === "midad") {
                    void navigate({ to: "/books" });
                    return;
                  }
                  if (item.href) {
                    void openExternalUrl(item.href);
                    return;
                  }
                  void navigate({ to: "/app/$id", params: { id: item.id } });
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-fg data-[selected=true]:bg-surface-2",
                )}
              >
                <Icon className="size-4 text-primary" />
                <span className="flex-1">{item.title[lang]}</span>
                <span className="text-xs text-subtle">{item.category}</span>
              </Command.Item>
            );
          })}
        </Command.List>
      </Command>
    </div>
  );
}
