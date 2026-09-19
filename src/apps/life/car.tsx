import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { pairLang } from "@/lib/locale";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Store = {
  plate: string;
  model: string;
  inspection: string;
  insurance: string;
  oilKm: number;
  currentKm: number;
  oilEvery: number;
};

const empty: Store = { plate: "", model: "", inspection: "", insurance: "", oilKm: 0, currentKm: 0, oilEvery: 5000 };

function daysUntil(iso: string) {
  if (!iso) return null;
  const t = new Date(`${iso}T00:00:00`).getTime();
  if (!Number.isFinite(t)) return null;
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return Math.round((t - n.getTime()) / 86400000);
}

export function CarApp() {
  const lang = pairLang(useAppStore((s) => s.lang));
  const [v, setV] = usePersistent<Store>("waha:car", empty);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const oilLeft = v.oilEvery > 0 ? v.oilKm + v.oilEvery - v.currentKm : null;

  function field(key: keyof Store, type: "text" | "date" | "number") {
    return (
      <Input
        type={type}
        value={v[key]}
        onChange={(e) => setV({ ...v, [key]: type === "number" ? Number(e.target.value) || 0 : e.target.value })}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("اللوحة", "Plate")}</span>
          {field("plate", "text")}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("الموديل", "Model")}</span>
          {field("model", "text")}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("انتهاء الفحص", "Inspection expiry")}</span>
          {field("inspection", "date")}
          <Due d={daysUntil(v.inspection)} lang={lang} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("انتهاء التأمين", "Insurance expiry")}</span>
          {field("insurance", "date")}
          <Due d={daysUntil(v.insurance)} lang={lang} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("الكم الحالي", "Current km")}</span>
          {field("currentKm", "number")}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("كم آخر زيت", "Last oil-change km")}</span>
          {field("oilKm", "number")}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("فترة الزيت (كم)", "Oil interval (km)")}</span>
          {field("oilEvery", "number")}
        </label>
      </div>
      {oilLeft != null ? (
        <p className={cn("text-sm", oilLeft <= 0 ? "text-danger" : oilLeft < 500 ? "text-warn" : "text-muted")}>
          {oilLeft <= 0
            ? L("حان تغيير الزيت", "Oil change is due")
            : L(`متبقي ${oilLeft.toLocaleString()} كم لتغيير الزيت`, `${oilLeft.toLocaleString()} km until oil change`)}
        </p>
      ) : null}
    </div>
  );
}

function Due({ d, lang }: { d: number | null; lang: "ar" | "en" }) {
  if (d == null) return null;
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const tone = d < 0 ? "text-danger" : d <= 30 ? "text-warn" : "text-muted";
  const label = d < 0 ? L(`انتهى منذ ${Math.abs(d)} يوماً`, `Expired ${Math.abs(d)} days ago`) : L(`متبقي ${d} يوماً`, `${d} days left`);
  return <p className={cn("mt-1 text-xs tabular-nums", tone)}>{label}</p>;
}
