import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";

function toB64(s: string) {
  return btoa(unescape(encodeURIComponent(s)));
}
function fromB64(s: string) {
  return decodeURIComponent(escape(atob(s)));
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function EncodeApp() {
  const lang = useAppStore((s) => s.lang);
  const [input, setInput] = useState("");
  const [out, setOut] = useState("");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-3">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={L("النص", "Text")} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setOut(toB64(input))}>Base64 →</Button>
        <Button size="sm" variant="secondary" onClick={() => { try { setOut(fromB64(input)); } catch { setOut(L("غير صالح", "Invalid")); } }}>Base64 ←</Button>
        <Button size="sm" variant="secondary" onClick={() => setOut(encodeURIComponent(input))}>URL →</Button>
        <Button size="sm" variant="secondary" onClick={() => setOut(decodeURIComponent(input))}>URL ←</Button>
        <Button size="sm" variant="secondary" onClick={() => void sha256(input).then(setOut)}>SHA-256</Button>
      </div>
      <Textarea className="min-h-28 font-mono" readOnly value={out} />
    </div>
  );
}
