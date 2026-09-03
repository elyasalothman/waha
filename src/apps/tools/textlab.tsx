import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";

export function TextlabApp() {
  const lang = useAppStore((s) => s.lang);
  const [text, setText] = useState("");
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split("\n").length : 0;
  const stats = useMemo(() => ({ chars, words, lines }), [chars, words, lines]);

  return (
    <div className="space-y-3">
      <Textarea className="min-h-40" value={text} onChange={(e) => setText(e.target.value)} />
      <p className="font-mono text-sm text-muted">
        {stats.chars} {lang === "ar" ? "حرف" : "chars"} · {stats.words} {lang === "ar" ? "كلمة" : "words"} · {stats.lines} {lang === "ar" ? "سطر" : "lines"}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setText(text.toUpperCase())}>ABC</Button>
        <Button size="sm" variant="secondary" onClick={() => setText(text.toLowerCase())}>abc</Button>
        <Button size="sm" variant="secondary" onClick={() => setText(text.replace(/\w\S*/g, (w) => w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase()))}>Title</Button>
        <Button size="sm" variant="secondary" onClick={() => setText([...text].reverse().join(""))}>{lang === "ar" ? "عكس" : "Reverse"}</Button>
        <Button size="sm" variant="secondary" onClick={() => setText([...new Set(text.split("\n"))].join("\n"))}>{lang === "ar" ? "فريد" : "Unique"}</Button>
        <Button size="sm" variant="secondary" onClick={() => setText(text.split("\n").sort((a, b) => a.localeCompare(b, lang)).join("\n"))}>{lang === "ar" ? "ترتيب" : "Sort"}</Button>
        <Button size="sm" variant="secondary" onClick={() => setText(text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim())}>{lang === "ar" ? "تنظيف" : "Trim"}</Button>
        <Button size="sm" variant="secondary" onClick={() => setText(text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))}>slug</Button>
      </div>
    </div>
  );
}
