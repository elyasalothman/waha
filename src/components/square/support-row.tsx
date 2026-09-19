import { houseProductDoors } from "@/lib/square/soft-money";
import type { Lang } from "@/lib/i18n";

export function SupportRow({
  lang,
  onSupport,
}: {
  lang: Lang;
  onSupport: () => void;
}) {
  const products = houseProductDoors();
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <nav
      className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 py-2 text-[12px] text-subtle"
      aria-label={L("دعم ومنتجات البيت", "Support and house products")}
      data-soft-money="row"
    >
      <button type="button" onClick={onSupport} className="hover:text-fg">
        {L("دعم", "Support")}
      </button>
      {products.map((door) => (
        <span key={door.id} className="inline-flex items-center gap-2">
          <span aria-hidden="true">·</span>
          <a href={door.href} data-door={door.id} className="hover:text-fg">
            {lang === "ar" ? door.title.ar.split(" · ")[0] : door.title.en.split(" · ")[0]}
          </a>
        </span>
      ))}
    </nav>
  );
}
