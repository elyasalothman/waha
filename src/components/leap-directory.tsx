import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAppStore } from "@/store/app-store";
import { hideMoney } from "@/lib/child-mode";
import { Star } from "lucide-react";
import { DIRECTORY_KEY, directoryState, LEAP_SERVICES } from "@/lib/leap-services";
import { ExternalLink } from "./external-link";
import { appIcon } from "@/lib/icons";
export function LeapDirectory({ home = false }: { home?: boolean }) {
  const segment = useAppStore((s) => s.segment);
  const [query, setQuery] = useState(""),
    [state, setState] = useState(() => directoryState(null)),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const read = () => {
      try {
        setState(directoryState(localStorage.getItem(DIRECTORY_KEY)));
      } catch {
        setNotice("التخزين المحلي غير متاح.");
      }
    };
    read();
    window.addEventListener("waha:directory", read);
    return () => window.removeEventListener("waha:directory", read);
  }, []);
  function save(next: typeof state) {
    setState(next);
    try {
      localStorage.setItem(DIRECTORY_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("waha:directory"));
    } catch {
      setNotice("تعذّر الحفظ على الجهاز.");
    }
  }
  const norm = (s: string) => s.replace(/[أإآ]/g, "ا").toLowerCase();
  const visible = LEAP_SERVICES.filter(
    (s) => !(hideMoney(segment) && s.group === "أخبار ومال"),
  ).filter((s) => norm(s.title + " " + s.words).includes(norm(query)));
  const card = (id: string) => {
    const s = LEAP_SERVICES.find((s) => s.id === id);
    if (!s || (hideMoney(segment) && s.group === "أخبار ومال")) return null;
    const Icon = appIcon(s.icon);
    return (
      <div
        key={s.id}
        className="relative flex min-w-0 items-start rounded-2xl border border-border bg-surface p-3"
      >
        <ExternalLink
          direct
          href={
            ["wiki", "phones", "bench", "market-sa"].includes(s.id) ? `/service/${s.id}` : s.href
          }
          onClick={() =>
            save({
              ...state,
              recent: [s.id, ...state.recent.filter((x) => x !== s.id)].slice(0, 8),
            })
          }
          className="flex min-h-16 min-w-0 flex-1 flex-col gap-2 pe-8 text-sm leading-6"
        >
          <Icon className="size-6 text-primary" />
          {s.title}
        </ExternalLink>
        <button
          className="absolute end-1 top-1 grid size-11 place-items-center"
          aria-label={`مفضلة ${s.title}`}
          aria-pressed={state.favorites.includes(s.id)}
          onClick={() =>
            save({
              ...state,
              favorites: state.favorites.includes(s.id)
                ? state.favorites.filter((x) => x !== s.id)
                : [...state.favorites, s.id],
            })
          }
        >
          <Star
            className="size-5 text-primary"
            fill={state.favorites.includes(s.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
    );
  };
  if (home)
    return (
      <div className="space-y-4">
        {[
          ["آخر ما فتحته", state.recent],
          ["مفضلتك", state.favorites],
        ].map(([title, ids]) => (
          <section key={title as string}>
            <h2 className="mb-2 font-display text-lg">{title}</h2>
            {(ids as string[]).length ? (
              <div className="grid grid-cols-2 gap-2">
                {(ids as string[]).slice(0, 2).map(card)}
              </div>
            ) : (
              <p className="text-sm text-muted">
                {title === "مفضلتك"
                  ? "نجمة بجانب الخدمة، وتلقاها هنا."
                  : "افتح خدمة لتعود إليها من هنا."}
              </p>
            )}
          </section>
        ))}
        <Link to="/services" className="flex min-h-11 items-center text-primary">
          كل خدمات الهجدة ←
        </Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-3xl">كل خدمات الهجدة</h1>
      <p className="text-sm leading-7 text-muted">
        تعلّم، تابع، أنجز والعب. حسابات المواقع مستقلة؛ الروابط الخارجية تفتح متصفح البيت في
        التطبيق، وتبويبًا على الويب.
      </p>
      <label className="block">
        بحث الخدمات
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="حصتي، المحللين، الجوالات…"
          className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface p-3"
        />
      </label>
      <nav className="flex flex-wrap gap-3">
        <Link to="/books" className="min-h-11 content-center text-primary">
          رف الكتب
        </Link>
        <Link
          to="/mohsen"
          search={{ q: "", mode: "chat", attach: false }}
          className="min-h-11 content-center text-primary"
        >
          اسأل محسن
        </Link>
        <Link to="/tools" className="min-h-11 content-center text-primary">
          كل أدوات واحة
        </Link>
      </nav>
      {["تعلّم", "أخبار ومال", "أدوات وذكاء", "ألعاب", "تسوّق"].map((group) => (
        <section key={group}>
          <h2 className="mb-3 font-display text-xl">{group}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.filter((s) => s.group === group).map((s) => card(s.id))}
          </div>
        </section>
      ))}
      {!visible.length && <p role="status">ما وجدنا خدمة بهذا الاسم؛ جرّب كلمة أخرى.</p>}
      <p role="status">{notice}</p>
    </div>
  );
}
