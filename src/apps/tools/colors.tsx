import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { PALETTE, hexToRgb } from "@/lib/palette";
import { useAppStore } from "@/store/app-store";

function parseHex(h: string) {
  const s = h.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
}

function lum(r: number, g: number, b: number) {
  const f = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  const l1 = lum(a.r, a.g, a.b);
  const l2 = lum(b.r, b.g, b.b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(c: { r: number; g: number; b: number }, t: number, toward: { r: number; g: number; b: number }) {
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  const rgb = { r: m(c.r, toward.r), g: m(c.g, toward.g), b: m(c.b, toward.b) };
  const hex = [rgb.r, rgb.g, rgb.b].map((n) => n.toString(16).padStart(2, "0")).join("");
  return `#${hex}`;
}

export function ColorsApp() {
  const lang = useAppStore((s) => s.lang);
  const [hex, setHex] = useState<string>(PALETTE.primary);
  const rgb = parseHex(hex);
  const paper = hexToRgb(PALETTE.fg);
  const ink = hexToRgb(PALETTE.bg);
  const ratioInk = rgb ? contrast(rgb, ink) : 0;
  const ratioPaper = rgb ? contrast(rgb, paper) : 0;
  const shades = useMemo(() => {
    if (!rgb) return [];
    return [0.15, 0.35, 0.5, 0.7, 0.85].map((t) => mix(rgb, t, t < 0.5 ? ink : paper));
  }, [hex]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="color" value={parseHex(hex) ? hex : PALETTE.primary} onChange={(e) => setHex(e.target.value)} className="h-11 w-14 cursor-pointer rounded-md border border-border bg-surface" />
        <Input value={hex} onChange={(e) => setHex(e.target.value)} />
      </div>
      {rgb ? (
        <>
          <p className="font-mono text-sm text-muted">
            RGB {rgb.r},{rgb.g},{rgb.b}
          </p>
          <p className="text-sm">
            {lang === "ar" ? "التباين مع الحبر" : "Contrast vs ink"}: {ratioInk.toFixed(2)} · {lang === "ar" ? "مع الورق" : "vs paper"}: {ratioPaper.toFixed(2)}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {shades.map((s) => (
              <button
                key={s}
                type="button"
                className="h-16 rounded-md border border-border"
                style={{ background: s }}
                onClick={() => {
                  void navigator.clipboard.writeText(s);
                  toast(t(lang, "copied"));
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-danger">{lang === "ar" ? "HEX غير صالح" : "Invalid hex"}</p>
      )}
    </div>
  );
}
