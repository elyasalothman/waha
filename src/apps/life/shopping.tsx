import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Item = { id: string; name: string; qty: string; done: boolean };

export function ShoppingApp() {
  const lang = useAppStore((s) => s.lang);
  const [items, setItems] = usePersistent<Item[]>("waha:shop", []);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const left = items.filter((i) => !i.done).length;

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setItems([{ id: crypto.randomUUID(), name: name.trim(), qty: qty.trim(), done: false }, ...items]);
          setName("");
          setQty("");
        }}
      >
        <Input className="flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "ar" ? "صنف" : "Item"} />
        <Input className="sm:w-28" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={lang === "ar" ? "الكمية" : "Qty"} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <p className="text-sm text-muted">{left} {lang === "ar" ? "متبقي" : "left"}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <input
              type="checkbox"
              className="size-5"
              checked={item.done}
              onChange={() => setItems(items.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x)))}
            />
            <span className={cn("flex-1 text-sm", item.done && "text-muted line-through")}>
              {item.name}
              {item.qty ? <span className="ms-2 text-muted">{item.qty}</span> : null}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setItems(items.filter((x) => x.id !== item.id))}>
              {t(lang, "delete")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
