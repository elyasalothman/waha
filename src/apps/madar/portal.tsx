import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, RotateCw, Star } from "lucide-react";
import { MadarMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { usePersistent } from "@/lib/storage";
import {
  classifyOmnibox,
  duckDuckGoUrl,
  HOUSE_SITES,
  isFavorite,
  looksLikeCalc,
  matchHouseSites,
  matchQuickTools,
  pushVisit,
  QUICK_TOOLS,
  toggleFavorite,
  translateUrl,
  wikipediaOpenUrl,
  wikipediaSummaryUrl,
  type HouseSite,
  type MadarVisit,
} from "@/lib/madar";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { openExternalUrl } from "@/lib/native-browser";
import { useAppStore } from "@/store/app-store";

type WikiHit = { title: string; extract: string; href: string };

function openExternal(href: string) {
  void openExternalUrl(href);
}

async function fetchWiki(query: string, lang: Lang): Promise<WikiHit | null> {
  try {
    const res = await fetch(wikipediaSummaryUrl(query, lang));
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
      type?: string;
    };
    if (!data.extract || data.type === "disambiguation") return null;
    return {
      title: data.title ?? query,
      extract: data.extract,
      href: data.content_urls?.desktop?.page ?? wikipediaOpenUrl(query, lang),
    };
  } catch {
    return null;
  }
}

export function MadarPortal({ initialQuery = "" }: { initialQuery?: string }) {
  const lang = useAppStore((s) => s.lang);
  const [draft, setDraft] = useState(initialQuery);
  const [active, setActive] = useState(initialQuery.trim());
  const [stack, setStack] = useState<string[]>(initialQuery.trim() ? [initialQuery.trim()] : []);
  const [wiki, setWiki] = useState<WikiHit | null>(null);
  const [wikiState, setWikiState] = useState<"idle" | "loading" | "done">("idle");
  const [history, setHistory] = usePersistent<MadarVisit[]>("waha:madar:history", []);
  const [favorites, setFavorites] = usePersistent<MadarVisit[]>("waha:madar:favorites", []);
  const inputRef = useRef<HTMLInputElement>(null);
  const consumedQuery = useRef<string | null>(initialQuery.trim() || null);
  const submitRef = useRef<(raw: string, fromStack?: boolean) => void>(() => {});

  const intent = useMemo(() => classifyOmnibox(active), [active]);
  const house = useMemo(() => matchHouseSites(active || draft), [active, draft]);
  const liveHouse = useMemo(() => (draft.trim() && !active ? matchHouseSites(draft) : house), [draft, active, house]);
  const tools = useMemo(() => {
    const q = active || draft;
    const matched = matchQuickTools(q);
    if (looksLikeCalc(q) && !matched.some((item) => item.id === "calc")) {
      return [QUICK_TOOLS[0]!, ...matched];
    }
    return matched;
  }, [active, draft]);

  useEffect(() => {
    const q = initialQuery.trim();
    if (!q || consumedQuery.current === q) return;
    consumedQuery.current = q;
    submitRef.current(q);
  }, [initialQuery]);

  useEffect(() => {
    if (!active || intent.kind === "url") {
      setWiki(null);
      setWikiState("idle");
      return;
    }
    let live = true;
    setWikiState("loading");
    fetchWiki(active, lang).then((hit) => {
      if (!live) return;
      setWiki(hit);
      setWikiState("done");
    });
    return () => {
      live = false;
    };
  }, [active, intent.kind, lang]);

  function record(visit: MadarVisit) {
    setHistory((prev) => pushVisit(prev, visit));
  }

  function submit(raw: string, fromStack = false) {
    const next = raw.trim();
    const classified = classifyOmnibox(next);
    if (!next) {
      setActive("");
      setDraft("");
      if (!fromStack) setStack([]);
      return;
    }
    setDraft(next);
    setActive(next);
    if (!fromStack) setStack((prev) => (prev[prev.length - 1] === next ? prev : [...prev, next]));

    if (classified.kind === "url" && classified.href) {
      record({ title: classified.href, query: next, href: classified.href, kind: "url", at: Date.now() });
      openExternal(classified.href);
      return;
    }
    record({ title: next, query: next, kind: "search", at: Date.now() });
  }
  submitRef.current = submit;

  function goHome() {
    setDraft("");
    setActive("");
    setStack([]);
    setWiki(null);
    inputRef.current?.focus();
  }

  function goBack() {
    if (stack.length <= 1) {
      goHome();
      return;
    }
    const next = stack.slice(0, -1);
    const q = next[next.length - 1] ?? "";
    setStack(next);
    submit(q, true);
  }

  function reload() {
    if (active) submit(active, true);
    else inputRef.current?.focus();
  }

  function openHouse(site: HouseSite) {
    record({ title: site.title[lang], query: site.title.ar, href: site.href, kind: "house", at: Date.now() });
    openExternal(site.href);
  }

  function starCurrent() {
    const href = intent.href ?? (active ? duckDuckGoUrl(active) : undefined);
    if (!active && !href) return;
    const item: MadarVisit = {
      title: active || href || "",
      query: active,
      href,
      kind: intent.kind,
      at: Date.now(),
    };
    setFavorites((prev) => toggleFavorite(prev, item));
  }

  const atHome = !active;
  const currentFav: MadarVisit = {
    title: active,
    query: active,
    href: intent.href ?? (active ? duckDuckGoUrl(active) : undefined),
    kind: intent.kind,
    at: 0,
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={goBack} aria-label={t(lang, "back")}>
          <ArrowRight className="size-4 rtl:rotate-0 ltr:rotate-180" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={reload} aria-label={t(lang, "madarReload")}>
          <RotateCw className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={goHome} aria-label={t(lang, "madarHome")}>
          <MadarMark className="size-5" />
        </Button>
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            dir="auto"
            autoComplete="off"
            spellCheck={false}
            placeholder={t(lang, "madarOmnibox")}
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-subtle"
            aria-label={t(lang, "madarOmnibox")}
          />
          <Button type="submit" variant="secondary" size="sm">
            {t(lang, "madarGo")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={starCurrent}
            disabled={!active}
            aria-label={t(lang, "madarFavorite")}
            className={cn(isFavorite(favorites, currentFav) && "text-primary")}
          >
            <Star className={cn("size-4", isFavorite(favorites, currentFav) && "fill-current")} />
          </Button>
        </form>
      </div>

      {atHome ? (
        <StartPage
          lang={lang}
          draft={draft}
          liveHouse={draft.trim() ? liveHouse : HOUSE_SITES}
          favorites={favorites}
          history={history}
          onOpenHouse={openHouse}
          onReplay={(visit) => {
            if (visit.kind === "house" && visit.href) {
              openExternal(visit.href);
              return;
            }
            submit(visit.kind === "url" && visit.href ? visit.href : visit.query);
          }}
          onToggleFav={(visit) => setFavorites((prev) => toggleFavorite(prev, visit))}
        />
      ) : (
        <ResultsPage
          lang={lang}
          query={active}
          intent={intent}
          house={house}
          tools={tools}
          wiki={wiki}
          wikiState={wikiState}
          onOpenHouse={openHouse}
          onWebSearch={() => openExternal(duckDuckGoUrl(active))}
        />
      )}
    </div>
  );
}

function StartPage({
  lang,
  draft,
  liveHouse,
  favorites,
  history,
  onOpenHouse,
  onReplay,
  onToggleFav,
}: {
  lang: Lang;
  draft: string;
  liveHouse: readonly HouseSite[];
  favorites: MadarVisit[];
  history: MadarVisit[];
  onOpenHouse: (site: HouseSite) => void;
  onReplay: (visit: MadarVisit) => void;
  onToggleFav: (visit: MadarVisit) => void;
}) {
  const filtering = Boolean(draft.trim());
  return (
    <div>
      <header className="mb-10 pt-4 text-center">
        <MadarMark className="mx-auto size-16" />
        <h1 className="mt-5 font-display text-5xl tracking-tight">{lang === "ar" ? "مدار" : "Madar"}</h1>
        <p className="mt-3 text-sm text-muted">{t(lang, "madarMeaning")}</p>
        <p className="mt-2 text-sm text-subtle">{t(lang, "madarBlurb")}</p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "madarHouse")}</h2>
        {liveHouse.length === 0 ? (
          <p className="text-sm text-muted">{t(lang, "madarNoHouse")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {liveHouse.map((site) => (
              <HouseCard key={site.id} site={site} lang={lang} onOpen={onOpenHouse} />
            ))}
          </div>
        )}
        {filtering ? <p className="mt-2 text-xs text-subtle">{t(lang, "madarHouseHint")}</p> : null}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "madarTools")}</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_TOOLS.map((tool) => (
            <a
              key={tool.id}
              href={tool.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-2"
            >
              {lang === "ar" ? tool.ar : tool.en}
            </a>
          ))}
        </div>
        <p className="mt-2 text-xs text-subtle">{t(lang, "madarToolsHint")}</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "madarKnowledge")}</h2>
        <p className="text-sm leading-relaxed text-muted">{t(lang, "madarKnowledgeHint")}</p>
      </section>

      {favorites.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "madarFavorites")}</h2>
          <VisitList items={favorites} lang={lang} onOpen={onReplay} onStar={onToggleFav} starred />
        </section>
      ) : null}

      {history.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "madarHistory")}</h2>
          <VisitList items={history} lang={lang} onOpen={onReplay} onStar={onToggleFav} />
        </section>
      ) : null}
    </div>
  );
}

function ResultsPage({
  lang,
  query,
  intent,
  house,
  tools,
  wiki,
  wikiState,
  onOpenHouse,
  onWebSearch,
}: {
  lang: Lang;
  query: string;
  intent: ReturnType<typeof classifyOmnibox>;
  house: readonly HouseSite[];
  tools: ReturnType<typeof matchQuickTools>;
  wiki: WikiHit | null;
  wikiState: "idle" | "loading" | "done";
  onOpenHouse: (site: HouseSite) => void;
  onWebSearch: () => void;
}) {
  return (
    <div className="space-y-8">
      {intent.kind === "url" && intent.href ? (
        <p className="text-sm text-muted">
          {t(lang, "madarOpened")}{" "}
          <span className="font-mono text-fg" dir="ltr">
            {intent.href}
          </span>
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "madarHouse")}</h2>
        {house.length === 0 ? (
          <p className="text-sm text-muted">{t(lang, "madarNoHouse")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {house.map((site) => (
              <HouseCard key={site.id} site={site} lang={lang} onOpen={onOpenHouse} />
            ))}
          </div>
        )}
      </section>

      {tools.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "madarTools")}</h2>
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <a
                key={tool.id}
                href={tool.id === "translate" ? translateUrl(query, lang) : tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-3 text-sm hover:bg-surface-2"
              >
                {lang === "ar" ? tool.ar : tool.en}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "madarKnowledge")}</h2>
        {wikiState === "loading" ? <p className="text-sm text-muted">{t(lang, "loading")}</p> : null}
        {wiki ? (
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-medium">{wiki.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{wiki.extract}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={wiki.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {t(lang, "madarWiki")}
              </a>
              <a
                href={translateUrl(query, lang)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {t(lang, "madarTranslate")}
              </a>
            </div>
          </div>
        ) : wikiState === "done" ? (
          <div className="flex flex-wrap gap-3 text-sm">
            <a href={wikipediaOpenUrl(query, lang)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {t(lang, "madarWiki")}
            </a>
            <a href={translateUrl(query, lang)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {t(lang, "madarTranslate")}
            </a>
          </div>
        ) : null}
      </section>

      <section>
        <Button type="button" onClick={onWebSearch}>
          {t(lang, "madarWebSearch")}
        </Button>
        <p className="mt-2 text-xs text-subtle">{t(lang, "madarWebHint")}</p>
      </section>
    </div>
  );
}

function HouseCard({ site, lang, onOpen }: { site: HouseSite; lang: Lang; onOpen: (site: HouseSite) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(site)}
      className="rounded-xl border border-border bg-surface px-4 py-3 text-start hover:bg-surface-2"
    >
      <span className="block font-medium">{site.title[lang]}</span>
      <span className="mt-1 block text-xs text-muted">{site.blurb[lang]}</span>
    </button>
  );
}

function VisitList({
  items,
  lang,
  onOpen,
  onStar,
  starred = false,
}: {
  items: MadarVisit[];
  lang: Lang;
  onOpen: (visit: MadarVisit) => void;
  onStar: (visit: MadarVisit) => void;
  starred?: boolean;
}) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {items.map((item) => (
        <li key={`${item.href ?? item.query}-${item.at}`} className="flex items-center gap-2 px-3">
          <button type="button" onClick={() => onOpen(item)} className="min-w-0 flex-1 py-3 text-start text-sm">
            <span className="block truncate">{item.title}</span>
            {item.href && item.href !== item.title ? (
              <span className="mt-0.5 block truncate font-mono text-xs text-subtle" dir="ltr">
                {item.href}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onStar(item)}
            className={cn("p-2 text-muted hover:text-fg", starred && "text-primary")}
            aria-label={t(lang, "madarFavorite")}
          >
            <Star className={cn("size-3.5", starred && "fill-current")} />
          </button>
        </li>
      ))}
    </ul>
  );
}
