import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Client = { id: string; name: string; company: string; phone: string; note: string };

export function ClientsApp() {
  const lang = useAppStore((s) => s.lang);
  const [rows, setRows] = usePersistent<Client[]>("waha:clients", []);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setRows([{ id: crypto.randomUUID(), name: name.trim(), company: company.trim(), phone: phone.trim(), note: "" }, ...rows]);
          setName("");
          setCompany("");
          setPhone("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={L("الاسم", "Name")} />
        <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={L("المنشأة", "Company")} />
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={L("الجوال", "Phone")} dir="ltr" />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{L("أضف عملاءك لمتابعة التواصل.", "Add clients to keep follow-ups close.")}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted">{c.company}</p>
                  {c.phone ? (
                    <a href={`tel:${c.phone}`} className="mt-1 inline-block font-mono text-sm text-primary" dir="ltr">
                      {c.phone}
                    </a>
                  ) : null}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((x) => x.id !== c.id))}>
                  {t(lang, "delete")}
                </Button>
              </div>
              <Textarea
                className="mt-3 min-h-20"
                value={c.note}
                onChange={(e) => setRows(rows.map((x) => (x.id === c.id ? { ...x, note: e.target.value } : x)))}
                placeholder={L("آخر تواصل أو ملاحظة", "Last contact or a note")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
