import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";

export function Seg<T extends string>({
  value,
  onChange,
  options,
  lang,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; ar: string; en: string }[];
  lang: Lang;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Button
          key={o.id}
          type="button"
          size="sm"
          variant={value === o.id ? "default" : "secondary"}
          onClick={() => onChange(o.id)}
        >
          {lang === "ar" ? o.ar : o.en}
        </Button>
      ))}
    </div>
  );
}
