import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Note = { id: string; title: string; body: string; updated: number };

export function NotesApp() {
  const lang = useAppStore((s) => s.lang);
  const [notes, setNotes] = usePersistent<Note[]>("waha:notes", []);
  const [cur, setCur] = usePersistent("waha:notes-cur", "");
  const active = notes.find((n) => n.id === cur) ?? notes[0] ?? null;

  function add() {
    const n: Note = { id: crypto.randomUUID(), title: lang === "ar" ? "بدون عنوان" : "Untitled", body: "", updated: Date.now() };
    setNotes([n, ...notes]);
    setCur(n.id);
  }

  function patch(p: Partial<Note>) {
    if (!active) return;
    setNotes(notes.map((n) => (n.id === active.id ? { ...n, ...p, updated: Date.now() } : n)));
  }

  return (
    <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
      <div>
        <Button className="mb-2 w-full" onClick={add}>
          {t(lang, "add")}
        </Button>
        <div className="space-y-1">
          {notes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setCur(n.id)}
              className={cn(
                "block w-full rounded-md px-3 py-2 text-start text-sm",
                n.id === active?.id ? "bg-surface-2" : "hover:bg-surface",
              )}
            >
              {n.title || (lang === "ar" ? "بدون عنوان" : "Untitled")}
            </button>
          ))}
        </div>
      </div>
      {active ? (
        <div className="space-y-2">
          <Input value={active.title} onChange={(e) => patch({ title: e.target.value })} />
          <Textarea className="min-h-64" value={active.body} onChange={(e) => patch({ body: e.target.value })} />
          <Button variant="danger" size="sm" onClick={() => setNotes(notes.filter((n) => n.id !== active.id))}>
            {t(lang, "delete")}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">{t(lang, "empty")}</p>
      )}
    </div>
  );
}
