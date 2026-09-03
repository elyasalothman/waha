import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Seg } from "@/components/seg";
import { DUA_GROUPS } from "@/lib/duas";
import { speak } from "@/lib/speak";
import { useAppStore } from "@/store/app-store";

export function DuaApp() {
  const lang = useAppStore((s) => s.lang);
  const [gid, setGid] = useState(DUA_GROUPS[0]!.id);
  const group = DUA_GROUPS.find((g) => g.id === gid) ?? DUA_GROUPS[0]!;
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-4">
      <Seg
        lang={lang}
        value={gid}
        onChange={setGid}
        options={DUA_GROUPS.map((g) => ({ id: g.id, ar: g.ar, en: g.en }))}
      />
      <ul className="space-y-3">
        {group.items.map((d) => (
          <li key={d.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-muted">{lang === "ar" ? d.ar : d.en}</p>
              <Button size="sm" variant="ghost" onClick={() => speak(d.textAr, "ar")}>
                {L("استمع", "Listen")}
              </Button>
            </div>
            <p className="mt-3 font-display text-2xl leading-relaxed">{d.textAr}</p>
            {lang === "en" ? <p className="mt-2 text-sm text-muted">{d.textEn}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
