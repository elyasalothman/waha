import { useEffect, useId, useRef, useState } from "react";

type Speech = {
  lang: string;
  onresult:
    ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        d="M12 14.2a3.2 3.2 0 0 0 3.2-3.2V6.2a3.2 3.2 0 0 0-6.4 0v4.8a3.2 3.2 0 0 0 3.2 3.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M6.2 11a5.8 5.8 0 0 0 11.6 0M12 16.8V20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Starts only after a click. Unsupported browsers keep a disabled icon. */
export function MohsenVoice({ onText }: { onText: (text: string) => void }) {
  const [available, setAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef<Speech | null>(null);
  const errorId = useId();
  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: new () => Speech;
      webkitSpeechRecognition?: new () => Speech;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    setAvailable(!!Ctor);
    if (Ctor) {
      rec.current = new Ctor();
      rec.current.lang = "ar-SA";
    }
    return () => rec.current?.stop();
  }, []);
  const label = !available
    ? "الإملاء غير متاح في هذا المتصفح"
    : listening
      ? "إيقاف الإملاء"
      : "إملاء صوتي";
  return (
    <span className="relative">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full border border-border text-primary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
        aria-pressed={listening}
        aria-label={label}
        title={label}
        disabled={!available}
        aria-describedby={error ? errorId : undefined}
        onClick={() => {
          if (!available || !rec.current) return;
          if (listening) {
            rec.current.stop();
            setListening(false);
            return;
          }
          rec.current.onresult = (e) => onText(e.results[0][0].transcript);
          rec.current.onerror = () => {
            setError("تعذّر الإملاء. تقدر تكتب بدل ذلك.");
            setListening(false);
          };
          rec.current.onend = () => setListening(false);
          try {
            rec.current.start();
            setListening(true);
            setError("");
          } catch {
            setError("تعذّر الإملاء. تقدر تكتب بدل ذلك.");
            setListening(false);
          }
        }}
      >
        <MicGlyph />
      </button>
      {listening ? <span className="sr-only">جاري الاستماع</span> : null}
      {error ? (
        <span id={errorId} role="alert" className="absolute bottom-full mb-1 w-40 text-xs leading-5">
          {error}
        </span>
      ) : null}
    </span>
  );
}
