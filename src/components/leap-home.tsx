import { MohsenVoice } from "./mohsen-voice";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LeapDirectory } from "./leap-directory";
import { HomeWeather } from "./home-weather";
import { HomeNews } from "./home-news";
import { Analysts } from "./analysts";
import { useSettings } from "@/store/settings-store";
export function LeapHome() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const [morning, setMorning] = useState(true);
  useEffect(() => setMorning(new Date().getHours() < 12), []);
  const settings = useSettings((s) => s.settings);
  return (
    <div className="mx-auto max-w-3xl space-y-4" dir="rtl">
      <section className="min-h-[280px] rounded-3xl border border-primary/25 bg-primary/5 p-5">
        <p className="mb-2 text-sm text-primary">واحة · مساحة يومك</p>
        <h1 className="font-display text-3xl">وش ودّك تنجز اليوم؟</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim())
              void navigate({
                to: "/mohsen",
                search: { q: q.trim(), mode: "chat", attach: false },
              });
          }}
          className="mt-4"
        >
          <label htmlFor="home-mohsen" className="sr-only">
            اسأل محسن
          </label>
          <input
            id="home-mohsen"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={8000}
            placeholder="اسأل محسن…"
            className="min-h-14 w-full rounded-2xl border border-border bg-bg px-4 text-base"
          />
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_3.5rem] items-center gap-2">
            <button
              className="min-h-11 whitespace-nowrap rounded-xl bg-primary px-2 text-primary-fg"
              disabled={!q.trim()}
            >
              اسأل محسن ←
            </button>
            <Link
              to="/mohsen"
              search={{ q: "", mode: "chat", attach: true }}
              className="min-h-11 whitespace-nowrap content-center rounded-xl border border-border px-3"
            >
              إرفاق ملف
            </Link>
            <span className="block min-h-11 w-14">
              <MohsenVoice onText={setQ} />
            </span>
          </div>
        </form>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[morning ? "رتّب لي صباحي" : "رتّب لي مسائي", "لخّص لي فكرة", "اقترح لي مهارة"].map(
            (text) => (
              <Link
                key={text}
                to="/mohsen"
                search={{ q: text, mode: "chat", attach: false }}
                className="min-h-11 content-center rounded-full border border-border bg-bg px-1 text-center text-xs"
              >
                {text}
              </Link>
            ),
          )}
        </div>
      </section>
      <LeapDirectory home />
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link to="/books" className="min-h-11 content-center text-primary">
          رف كتبك ←
        </Link>
        <Link to="/worship" className="min-h-11 content-center text-primary">
          عبادتك ←
        </Link>
        <Link to="/today" className="min-h-11 content-center text-primary">
          يومك ومتابعتك ←
        </Link>
      </nav>
      {settings.weatherWidget && (
        <Link
          to="/app/$id"
          params={{ id: "weather" }}
          className="block rounded-2xl border border-border bg-surface p-3"
        >
          <HomeWeather />
        </Link>
      )}
      {settings.newsWidget && <HomeNews compact />}
      {!settings.childMode && <Analysts compact />}
    </div>
  );
}
