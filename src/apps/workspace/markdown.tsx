import { useMemo } from "react";
import { Textarea } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

function render(src: string) {
  const esc = src.replaceAll("&", "&").replaceAll("<", "<").replaceAll(">", ">");
  return esc
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" rel="noreferrer" target="_blank">$1</a>')
    .replace(/^(?:- (.*)$)/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>")
    .replace(/^(?!<h|<ul|<li)(.+)$/gm, "<p>$1</p>");
}

export function MarkdownApp() {
  const lang = useAppStore((s) => s.lang);
  const [text, setText] = usePersistent(
    "waha:md",
    lang === "ar" ? "# مرحباً\n\nاكتب **هنا**." : "# Hello\n\nWrite **here**.",
  );
  const html = useMemo(() => render(text), [text]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Textarea className="min-h-80 font-mono" value={text} onChange={(e) => setText(e.target.value)} />
      <div
        className="min-h-80 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed [&_a]:text-primary [&_code]:font-mono [&_h1]:mb-2 [&_h1]:text-2xl [&_h2]:mb-2 [&_h2]:text-xl [&_li]:ms-4 [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
