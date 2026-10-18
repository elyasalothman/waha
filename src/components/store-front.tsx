import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Library, ArrowRight, Gift, Sparkles, Check } from "lucide-react";
import { appIcon } from "@/lib/icons";
import { normalizeSearch } from "@/lib/superapp";
import {
  STORE_CATEGORIES,
  STORE_LIBRARY_KEY,
  visibleProducts,
  normalizeLibrary,
  acquireProduct,
  PRO_SECTION_TITLE,
  type StoreCategory,
  type StoreProduct,
} from "@/lib/store/catalog";
import { useAppStore } from "@/store/app-store";
import { featuredProTool } from "@/lib/store/pro";

const button =
  "min-h-11 rounded-xl border border-border px-4 py-2 text-sm hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary";
export function StoreFront() {
  const child = useAppStore((s) => s.segment) === "child";
  const navigate = useNavigate();
  const [category, setCategory] = useState<StoreCategory | "all">("all");
  const [libraryView, setLibraryView] = useState(false);
  const [library, setLibrary] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const load = () => {
      try {
        setLibrary(normalizeLibrary(JSON.parse(localStorage.getItem(STORE_LIBRARY_KEY) || "[]")));
      } catch {
        setLibrary([]);
      }
    };
    load();
    setReady(true);
    window.addEventListener("storage", load);
    // Warm the pro tool bundles so they also open offline after this visit.
    const warm = () => {
      void import("@/apps/pro/cv-builder");
      void import("@/apps/pro/pdf-studio");
      void import("@/apps/pro/scanner");
      void import("@/apps/pro/image-studio");
    };
    const idle = window.setTimeout(warm, 1500);
    return () => {
      window.removeEventListener("storage", load);
      window.clearTimeout(idle);
    };
  }, []);
  const products = visibleProducts(child);
  const product = products.find((p) => p.id === selected);
  const owned = products.filter((p) => library.includes(p.id));
  const home = !libraryView && category === "all" && !query;
  const featured = products.find((p) => p.id === featuredProTool().id);
  const proTools = products.filter((p) => p.category === "pro");
  const shown = (libraryView ? owned : products).filter(
    (p) =>
      (category === "all" || p.category === category) &&
      !(home && p.category === "pro") &&
      normalizeSearch(`${p.name} ${p.description} ${p.source}`).includes(normalizeSearch(query)),
  );
  async function acquire(id: string, href: string) {
    try {
      // Read at action time so another tab's acquisition is retained.
      let raw: unknown = [];
      try {
        raw = JSON.parse(localStorage.getItem(STORE_LIBRARY_KEY) || "[]");
      } catch {
        /* recover malformed saved data */
      }
      const next = acquireProduct(raw, id, child);
      if (!next.includes(id)) return;
      localStorage.setItem(STORE_LIBRARY_KEY, JSON.stringify(next));
      setLibrary(next);
      setError("");
      await navigate({ to: href });
    } catch {
      setError(
        "تعذّر حفظ المنتج في مكتبتك. تحقق من مساحة التخزين أو إعدادات المتصفح ثم أعد المحاولة.",
      );
    }
  }
  const openProduct = (id: string) => {
    setSelected(id);
    setError("");
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    setSelected(null);
    setError("");
  };
  return (
    <section dir="rtl" className="mx-auto max-w-4xl space-y-5 pb-8" aria-label="متجر واحة">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/store"
          onClick={() => {
            back();
            setLibraryView(false);
          }}
          className="flex min-h-11 items-center gap-2 font-display text-2xl"
        >
          <ShoppingBag className="text-primary" />
          المتجر
        </Link>
        <button
          className={button}
          aria-pressed={libraryView}
          onClick={() => {
            back();
            setLibraryView(!libraryView);
            setCategory("all");
            setQuery("");
          }}
        >
          <Library className="me-2 inline size-4" />
          {libraryView ? "تصفّح المتجر" : "مكتبتي"} <span>({ready ? owned.length : 0})</span>
        </button>
      </header>
      {product ? (
        <article
          className="space-y-5 rounded-3xl border border-border bg-surface p-5"
          aria-label="صفحة المنتج"
        >
          <button className={button} onClick={back}>
            <ArrowRight className="me-2 inline size-4" />
            رجوع للمنتجات
          </button>
          <ProductArt icon={product.icon} large />
          <p className="text-sm text-primary">
            {STORE_CATEGORIES.find((c) => c.id === product.category)?.label} · {product.source}
          </p>
          <h1 className="font-display text-3xl">{product.name}</h1>
          <p className="leading-8 text-muted">{product.description}</p>
          <p className="text-lg">
            مجاني <span className="text-sm text-primary">· مجانًا لفترة الإطلاق</span>
          </p>
          {product.marketRef && <p className="text-sm text-muted">{product.marketRef}</p>}
          {product.features && (
            <ul className="space-y-1 text-sm">
              {product.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          <p className="break-words text-xs text-muted">
            المصدر: <span dir="ltr">{product.sourceUrl}</span>
          </p>
          <p className="text-sm text-muted">
            حصل عليه على هذا الجهاز: {ready && library.includes(product.id) ? 1 : 0}
          </p>
          <button
            disabled={!ready}
            className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-fg disabled:opacity-50"
            onClick={() => acquire(product.id, product.href)}
          >
            {library.includes(product.id) ? "افتح من مكتبتي" : "احصل عليه مجانًا"}
          </button>
          <p className="text-xs leading-6 text-muted">
            تُحفظ الإضافة على هذا المتصفح فقط. قد يحتاج المحتوى إلى اتصال؛ الكتالوج متاح دون اتصال
            بعد زيارته.
          </p>
        </article>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-bl from-primary/20 via-surface to-bg p-6">
            <Gift className="mb-5 size-9 text-primary" aria-hidden="true" />
            <p className="mb-2 text-sm text-primary">من بيت الهجدة، إلى يومك</p>
            <h1 className="font-display text-3xl leading-relaxed">
              {libraryView ? "مكتبتك، على هذا الجهاز" : "شيء تتعلّمه. كتاب تقرؤه. لعبة تحبّها."}
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              {libraryView
                ? "كل ما حصلت عليه، لتعود إليه بسهولة. الحفظ محلي ولا تتم مزامنته مع الحساب."
                : "منتجاتنا أولًا · مجاني لفترة الإطلاق. اختر ما يعجبك وأضفه إلى مكتبتك."}
            </p>
          </div>
          {home && featured && (
            <article
              className="space-y-3 rounded-3xl border-2 border-primary/60 bg-surface p-5"
              aria-label="المنتج المميز"
            >
              <p className="flex items-center gap-1.5 text-sm text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                {PRO_SECTION_TITLE}
              </p>
              <div className="flex items-start gap-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <ProIcon icon={featured.icon} />
                </span>
                <div className="min-w-0 space-y-1">
                  <h2 className="font-display text-2xl">{featured.name}</h2>
                  <p className="text-sm leading-7 text-muted">{featured.description}</p>
                </div>
              </div>
              <p className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-fg">
                  مجانًا لفترة الإطلاق
                </span>
                <span className="text-xs text-muted">{featured.marketRef}</span>
              </p>
              <button
                disabled={!ready}
                className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-fg disabled:opacity-50"
                onClick={() => acquire(featured.id, featured.href)}
              >
                {library.includes(featured.id) ? "افتح من مكتبتي" : "احصل عليه مجانًا"}
              </button>
            </article>
          )}
          {home && proTools.length > 0 && (
            <section aria-label={PRO_SECTION_TITLE} className="space-y-3">
              <h2 className="font-display text-xl">{PRO_SECTION_TITLE}</h2>
              <p className="text-xs leading-6 text-muted">
                أدوات من صنع واحة تعمل على جهازك. المقارنة بأسعار تقريبية لبرامج مدفوعة مشابهة، لا
                بمنتج بعينه.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {proTools.map((p) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    owned={library.includes(p.id)}
                    onOpen={openProduct}
                  />
                ))}
              </div>
              <h2 className="pt-2 font-display text-xl">من بيت الهجدة</h2>
            </section>
          )}
          <label className="block">
            <span className="sr-only">ابحث في المتجر</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مسار، كتاب أو لعبة…"
              className="min-h-12 w-full rounded-xl border border-border bg-surface px-4"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="فئات المتجر">
            {[{ id: "all", label: "الكل" }, ...STORE_CATEGORIES].map((c) => (
              <button
                key={c.id}
                className={`${button} ${category === c.id ? "bg-primary text-primary-fg" : "bg-surface"}`}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id as StoreCategory | "all")}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p role="status" className="text-sm text-muted">
            {shown.length} منتج{child ? " · محتوى مناسب لوضع الطفل" : ""}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shown.map((p) => (
              <ProductCard key={p.id} p={p} owned={library.includes(p.id)} onOpen={openProduct} />
            ))}
          </div>
          {!shown.length && (
            <p className="rounded-2xl border border-border p-6 text-muted">
              {libraryView
                ? "مكتبتك فارغة هنا. تصفّح المتجر واحصل على أول منتج مجانًا."
                : "لم نجد منتجات بهذه الخيارات. جرّب فئة أخرى أو غيّر البحث."}
            </p>
          )}
        </>
      )}
      {selected && !product && (
        <p role="status">
          هذا المنتج غير متاح في وضع الطفل.{" "}
          <button className={button} onClick={back}>
            رجوع
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-red-400 p-4">
          {error}
        </p>
      )}
    </section>
  );
}
function ProIcon({ icon }: { icon: string }) {
  const Icon = appIcon(icon);
  return <Icon className="size-8" strokeWidth={1.5} aria-hidden="true" />;
}
function ProductCard({
  p,
  owned,
  onOpen,
}: {
  p: StoreProduct;
  owned: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onOpen(p.id)}
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface text-start hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
      aria-label={`عرض ${p.name}`}
    >
      <ProductArt icon={p.icon} />
      <span className="flex flex-1 flex-col gap-2 p-3">
        <span className="text-[11px] text-primary">{p.source}</span>
        <span className="font-medium leading-7">{p.name}</span>
        <span className="line-clamp-2 text-xs leading-6 text-muted">{p.description}</span>
        {p.marketRef && <span className="text-[11px] leading-5 text-muted">{p.marketRef}</span>}
        <span className="mt-auto pt-2 text-sm">{owned ? "في مكتبتك ✓" : "مجاني"}</span>
        <span className="text-[10px] text-primary">مجانًا لفترة الإطلاق</span>
      </span>
    </button>
  );
}
function ProductArt({ icon, large = false }: { icon: string; large?: boolean }) {
  const Icon = appIcon(icon);
  return (
    <span
      className={`grid w-full place-items-center bg-gradient-to-bl from-primary/20 to-surface-2 text-primary ${large ? "h-44 rounded-2xl" : "h-28"}`}
    >
      <Icon className={large ? "size-16" : "size-10"} strokeWidth={1.3} aria-hidden="true" />
    </span>
  );
}
