import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Round = { id: string; us: number; them: number };

type Store = { us: number; them: number; rounds: Round[]; target: number };

const EMPTY: Store = { us: 0, them: 0, rounds: [], target: 152 };

export function BalootApp() {
  const lang = useAppStore((s) => s.lang);
  const [s, setS] = usePersistent<Store>("waha:baloot", EMPTY);
  const [us, setUs] = usePersistent("waha:baloot-in-us", 0);
  const [them, setThem] = usePersistent("waha:baloot-in-them", 0);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const done = s.us >= s.target || s.them >= s.target;
  const lead = s.us === s.them ? null : s.us > s.them ? "us" : "them";

  function add(u: number, tmg: number) {
    if (done) return;
    const nextUs = s.us + u;
    const nextThem = s.them + tmg;
    setS({
      ...s,
      us: nextUs,
      them: nextThem,
      rounds: [{ id: crypto.randomUUID(), us: u, them: tmg }, ...s.rounds].slice(0, 40),
    });
    setUs(0);
    setThem(0);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <TeamCard title={L("لنا", "Us")} score={s.us} target={s.target} win={done && lead === "us"} />
        <TeamCard title={L("لهم", "Them")} score={s.them} target={s.target} win={done && lead === "them"} />
      </div>
      {done ? (
        <p className="text-center font-display text-2xl">{lead === "us" ? L("لنا الفوز", "We win") : L("لهم الفوز", "They win")}</p>
      ) : (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted">{L("لنا", "Us")}</span>
              <Input type="number" min={0} value={us} onChange={(e) => setUs(Number(e.target.value) || 0)} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">{L("لهم", "Them")}</span>
              <Input type="number" min={0} value={them} onChange={(e) => setThem(Number(e.target.value) || 0)} />
            </label>
          </div>
          <Button className="w-full" onClick={() => add(us, them)}>
            {L("أضف الجولة", "Add round")}
          </Button>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 16, 24].map((n) => (
              <Button key={`u${n}`} size="sm" variant="secondary" onClick={() => add(n, 0)}>
                {L(`لنا +${n}`, `Us +${n}`)}
              </Button>
            ))}
            {[5, 10, 16, 24].map((n) => (
              <Button key={`t${n}`} size="sm" variant="outline" onClick={() => add(0, n)}>
                {L(`لهم +${n}`, `Them +${n}`)}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-between">
        <p className="text-sm text-muted">{L("اللعب حتى ١٥٢", "Play to 152")}</p>
        <Button size="sm" variant="ghost" onClick={() => setS(EMPTY)}>
          {t(lang, "newGame")}
        </Button>
      </div>
      {s.rounds.length > 0 ? (
        <ul className="space-y-1">
          {s.rounds.map((r) => (
            <li key={r.id} className="flex justify-between rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm tabular-nums">
              <span>{r.us}</span>
              <span className="text-subtle">{L("جولة", "round")}</span>
              <span>{r.them}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TeamCard({ title, score, target, win }: { title: string; score: number; target: number; win: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-surface p-5", win ? "border-primary" : "border-border")}>
      <p className="text-xs text-muted">{title}</p>
      <p className="mt-2 font-display text-5xl tabular-nums">{score}</p>
      <p className="mt-1 text-xs text-subtle">/ {target}</p>
    </div>
  );
}
