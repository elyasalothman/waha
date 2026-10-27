import { useEffect, useRef, useState } from "react";
type Speech = {
  lang: string;
  onresult:
    ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
export function MohsenVoice({ onText }: { onText: (text: string) => void }) {
  const [available, setAvailable] = useState(false),
    [listening, setListening] = useState(false),
    [error, setError] = useState("");
  const rec = useRef<Speech | null>(null);
  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: new () => Speech;
      webkitSpeechRecognition?: new () => Speech;
    };
    const C = w.SpeechRecognition || w.webkitSpeechRecognition;
    setAvailable(!!C);
    if (C) {
      rec.current = new C();
      rec.current.lang = "ar-SA";
    }
    return () => rec.current?.stop();
  }, []);
  if (!available) return null;
  return (
    <>
      <button
        type="button"
        aria-pressed={listening}
        className="min-h-11 rounded-xl border border-border px-3 text-sm"
        onClick={() => {
          if (listening) {
            rec.current?.stop();
            setListening(false);
            return;
          }
          if (!rec.current) return;
          rec.current.onresult = (e) => onText(e.results[0][0].transcript);
          rec.current.onerror = () => {
            setError("تعذّر الميكروفون؛ يمكنك الكتابة.");
            setListening(false);
          };
          rec.current.onend = () => setListening(false);
          try {
            rec.current.start();
            setListening(true);
            setError("");
          } catch {
            setError("تعذّر الميكروفون؛ يمكنك الكتابة.");
          }
        }}
      >
        {listening ? "إيقاف المايك" : "مايك"}
      </button>
      {error && (
        <span role="status" className="text-xs">
          {error}
        </span>
      )}
    </>
  );
}
