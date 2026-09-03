import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";

export function JsonApp() {
  const lang = useAppStore((s) => s.lang);
  const [text, setText] = useState("{\n  \"waha\": true\n}");
  const [err, setErr] = useState("");

  function parse() {
    try {
      return JSON.parse(text) as unknown;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
      return null;
    }
  }

  return (
    <div className="space-y-3">
      <Textarea className="min-h-48 font-mono" value={text} onChange={(e) => { setText(e.target.value); setErr(""); }} />
      {err ? <p className="text-sm text-danger">{err}</p> : null}
      <div className="flex gap-2">
        <Button
          onClick={() => {
            const v = parse();
            if (v !== null) {
              setText(JSON.stringify(v, null, 2));
              setErr("");
            }
          }}
        >
          {lang === "ar" ? "تنسيق" : "Format"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const v = parse();
            if (v !== null) {
              setText(JSON.stringify(v));
              setErr("");
            }
          }}
        >
          {lang === "ar" ? "ضغط" : "Minify"}
        </Button>
      </div>
    </div>
  );
}
