import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Seg } from "@/components/seg";
import { searchNames } from "@/lib/names";
import { speak } from "@/lib/speak";
import { useAppStore } from "@/store/app-store";

type Gender = "all" | "m" | "f";

export function NamesApp() {
  const lang = useAppStore((s) => s.lang);
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<Gender>("all");
  const list = useMemo(() => searchNames(q, gender), [q, gender]);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L("اكتب اسماً… محمد، نورة، جود", "Type a name… Muhammad, Noura, Joud")} />
      <Seg
        lang={lang}
        value={gender}
        onChange={setGender}
        options={[
          { id: "all", ar: "الكل", en: "All" },
          { id: "m", ar: "أولاد", en: "Boys" },
          { id: "f", ar: "بنات", en: "Girls" },
        ]}
      />
      <p className="text-xs text-muted">{L(`${list.length} اسماً`, `${list.length} names`)}</p>
      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n.ar} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <div>
              <p className="font-display text-2xl">{n.ar}</p>
              <p className="text-sm text-muted">{n.en}</p>
              <p className="mt-1 text-sm">{lang === "ar" ? n.meanAr : n.meanEn}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => speak(n.ar, "ar")}>
              {L("استمع", "Listen")}
            </Button>
          </li>
        ))}
      </ul>
      {list.length === 0 ? <p className="text-sm text-muted">{L("لا يوجد هذا الاسم بعد — جرّب جزءاً منه.", "No match — try part of the name.")}</p> : null}
    </div>
  );
}
