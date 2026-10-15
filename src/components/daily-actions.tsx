import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AppCard } from "@/components/app-card";
import { forAudience } from "@/lib/catalog";
import { hideMoney, isMoneySurface } from "@/lib/child-mode";
import { HOME_SHORTCUTS_KEY, parseHomeShortcuts, resolveHomeShortcuts } from "@/lib/home-shortcuts";
import type { Lang } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export function DailyActions({ lang }: { lang: Lang }) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const audience = useAppStore((s) => s.audience);
  const segment = useAppStore((s) => s.segment);
  const available = forAudience(audience).filter(
    (item) => !hideMoney(segment) || !isMoneySurface(item),
  );
  const [stored, setStored] = useState<unknown>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const selected = resolveHomeShortcuts(stored, available);

  useEffect(() => {
    try {
      setStored(parseHomeShortcuts(localStorage.getItem(HOME_SHORTCUTS_KEY)));
    } catch {
      setSaved(false);
    }
    setReady(true);
  }, []);

  return (
    <section
      aria-labelledby="home-shortcuts-title"
      data-home-section="shortcuts"
      className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="home-shortcuts-title" className="text-base font-semibold">
          {L("اختصاراتك", "Your shortcuts")}
        </h2>
        <Dialog.Root
          open={open}
          onOpenChange={(next) => {
            if (next) setDraft(selected);
            setOpen(next);
          }}
        >
          <Dialog.Trigger asChild>
            <button
              type="button"
              disabled={!ready}
              className="min-h-11 rounded-lg px-2 text-sm font-medium text-primary hover:bg-surface-2 disabled:opacity-40"
            >
              {L("تعديل", "Edit")}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-fg/20 backdrop-blur-sm" />
            <Dialog.Content
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="fixed start-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-5 text-fg shadow-(--shadow-soft) ltr:-translate-x-1/2 rtl:translate-x-1/2"
            >
              <Dialog.Title className="text-xl font-semibold">
                {L("اختر ثلاثة اختصارات", "Choose three shortcuts")}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted">
                {L("تُحفظ اختياراتك على هذا الجهاز.", "Your choices are saved on this device.")}
              </Dialog.Description>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const next = resolveHomeShortcuts(draft, available);
                  setStored(next);
                  try {
                    localStorage.setItem(HOME_SHORTCUTS_KEY, JSON.stringify(next));
                    setSaved(true);
                  } catch {
                    setSaved(false);
                  }
                  setOpen(false);
                }}
              >
                <div className="mt-5 space-y-4">
                  {draft.map((id, index) => (
                    <label key={index} className="block text-sm">
                      {L("الاختصار", "Shortcut")} {index + 1}
                      <select
                        value={id}
                        onChange={(event) =>
                          setDraft((previous) =>
                            previous.map((value, slot) =>
                              slot === index ? event.target.value : value,
                            ),
                          )
                        }
                        className="mt-1 block h-11 w-full rounded-lg border border-border bg-bg px-3 text-fg"
                      >
                        {available.map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                            disabled={item.id !== id && draft.includes(item.id)}
                          >
                            {item.title[lang]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="min-h-11 rounded-lg px-4 text-sm hover:bg-surface-2"
                    >
                      {L("إلغاء", "Cancel")}
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="min-h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-fg"
                  >
                    {L("حفظ", "Save")}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {selected.map((id) => {
          const item = available.find((entry) => entry.id === id)!;
          return <AppCard key={id} item={item} lang={lang} compact />;
        })}
      </div>
      {!saved ? (
        <p className="mt-3 text-xs text-danger" role="status">
          {L(
            "تعذّر الحفظ على الجهاز؛ الاختيارات مؤقتة لهذه الزيارة.",
            "Device storage is unavailable; these choices last for this visit only.",
          )}
        </p>
      ) : null}
    </section>
  );
}
