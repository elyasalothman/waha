import { Link } from "@tanstack/react-router";
import { useAppStore } from "@/store/app-store";

/** Featured card for «جيش الواحة» on /games — cover art is a real in-game render. */
export function ArmyCard() {
  const lang = useAppStore((s) => s.lang);
  return (
    <Link
      to="/app/$id"
      params={{ id: "army" }}
      data-play-army
      className="group relative block overflow-hidden rounded-2xl border border-amber-500/40 shadow-sm"
      style={{ background: "linear-gradient(160deg,#ffe2ad,#f2b45e 60%,#1f9e9a)" }}
    >
      <img
        src="/games/army-cover.webp"
        alt=""
        width={780}
        height={440}
        loading="lazy"
        className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-56"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <span className="min-w-0">
          <span className="mb-1 inline-block rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950">
            {lang === "ar" ? "جديد · ثلاثية الأبعاد" : "New · 3D"}
          </span>
          <span className="block font-display text-3xl font-black text-white drop-shadow">
            {lang === "ar" ? "جيش الواحة" : "Oasis Army"}
          </span>
          <span className="mt-0.5 block text-sm text-white/90">
            {lang === "ar"
              ? "قُد رماتك عبر البوابات، اجمع القوس الذهبي، واهزم قطّاع الطرق."
              : "Lead your archers through the gates and beat the raiders."}
          </span>
        </span>
        <span className="grid min-h-12 shrink-0 place-items-center rounded-xl bg-white px-4 font-bold text-teal-800 shadow">
          {lang === "ar" ? "العب" : "Play"}
        </span>
      </span>
    </Link>
  );
}
