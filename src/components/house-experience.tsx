import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HouseDoors } from "@/components/house-doors";
import { MarketBrief } from "@/components/market-brief";
import { getHouseSite } from "@/lib/house-sites";
import { usePersistent } from "@/lib/storage";
import { isNativeIos, openHouseDoor } from "@/lib/native-browser";
import { featureButton } from "@/lib/share-card";

const field = "min-h-11 w-full min-w-0 rounded-lg border border-border bg-bg p-3";
const blocked = new Set(["tahajjud"]);

export function HouseExperience({ id }: { id: string }) {
  const site = getHouseSite(id)!;
  const [started, setStarted] = useState(false);
  const [native, setNative] = useState(false);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);
  const directory = ["sites", "home", "studio", "khazana"].includes(id);
  const embedded = ["hayat", "luma", "samar", "hissati", "tahajjud"].includes(id);
  return (
    <section
      className={
        expanded
          ? "fixed inset-0 z-50 flex flex-col gap-3 overflow-auto bg-bg p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          : "mx-auto max-w-5xl space-y-5"
      }
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{site.title.ar}</h1>
        {expanded ? (
          <button className={featureButton} onClick={() => setExpanded(false)}>
            رجوع لواحة
          </button>
        ) : (
          <Link to="/today" className={featureButton}>
            رجوع لواحة
          </Link>
        )}
      </header>
      {directory ? (
        <>
          {id === "khazana" && (
            <p className="text-muted">
              تطبيقات واحة المدمجة. أدوات الخزانة الـ٣٢ المستقلة لم تُنقل بعد.
            </p>
          )}
          {id === "studio" && (
            <p className="text-muted">
              هجدة استوديو رقمي مستقل من الرياض يصنع منتجات عربية للتعلم والعبادة والعمل واللعب.
            </p>
          )}
          <HouseDoors />
        </>
      ) : id === "amlak" ? (
        <PropertyLedger />
      ) : id === "agent" ? (
        <TaskDesk />
      ) : id === "manba" ? (
        <ArabicAsset />
      ) : id === "himaya" ? (
        <Protection />
      ) : id === "hudoo" || id === "manteq" ? (
        <>
          <p className="text-muted">
            {id === "hudoo"
              ? "موجز أسعار داخل واحة. قناة واتساب هدوء مستقلة ولا تتوفر لها تغذية عامة مدمجة."
              : "قراءة أسعار السوق داخل واحة. محفظة منطق الورقية وإشاراتها لم تُنقل؛ لا تُنفَّذ أوامر تداول هنا."}
          </p>
          <MarketBrief />
        </>
      ) : embedded ? (
        <>
          {blocked.has(id) ? (
            <div className="space-y-3 rounded-xl border border-border p-5">
              <p>
                المصدر يمنع عرضه داخل إطار من نطاق واحة. نحافظ على صفحتك هنا حتى يُفعّل المصدر
                السماح بالتضمين.
              </p>
              <button
                className={featureButton}
                onClick={async () => {
                  setNative(isNativeIos());
                  if (!isNativeIos()) {
                    setMessage(
                      "العرض المدمج متوقف على الويب بسبب إعداد حماية المصدر. يمكنك العودة لتطبيقات واحة أو تجربة ألعاب واحة.",
                    );
                    return;
                  }
                  try {
                    await openHouseDoor(site.href);
                  } catch {
                    setMessage("تعذّر فتح العرض الداخلي. حاول مرة أخرى.");
                  }
                }}
              >
                افتح العرض داخل التطبيق
              </button>
              {message && <p role="status">{message}</p>}
              {native && (
                <p className="text-sm text-muted">يفتح في نافذة واحة الداخلية مع زر الرجوع.</p>
              )}
              <Link to="/games" className={featureButton}>
                ألعاب واحة
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">
                {id === "hissati"
                  ? "حصتي داخل واحة: تعلم تفاعلي ودفتر المعلم. حساب حصتي مستقل؛ قد يقيّد Safari تسجيل الدخول داخل الإطار."
                  : "ابدأ التجربة عند الطلب. تبقى أدوات الرجوع وملء الشاشة داخل واحة."}
              </p>
              <div className="flex flex-wrap gap-2">
                <button className={featureButton} onClick={() => setStarted(true)}>
                  {id === "hissati" ? "ابدأ حصتي داخل واحة" : "ابدأ داخل واحة"}
                </button>
                <button
                  className={featureButton}
                  onClick={() => {
                    setStarted(true);
                    setExpanded(!expanded);
                  }}
                >
                  ملء الشاشة
                </button>
                {id === "hissati" && (
                  <Link to="/teacher" className={featureButton}>
                    دفتر المعلم
                  </Link>
                )}
              </div>
              {started && (
                <iframe
                  title={`${site.title.ar} داخل واحة`}
                  src={id === "samar" ? `${site.href}/samar/` : site.href}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals"
                  allow="fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className={
                    expanded
                      ? "min-h-96 w-full flex-1 rounded-xl border border-border"
                      : "h-[75dvh] min-h-96 w-full rounded-xl border border-border"
                  }
                />
              )}
            </>
          )}
        </>
      ) : (
        <p>هذه التجربة تحتاج إلى دمج إضافي.</p>
      )}
    </section>
  );
}

function PropertyLedger() {
  const [rows, setRows, ready] = usePersistent<
    Array<{ id: string; unit: string; rent: number; due: string }>
  >("waha:amlak:v1", []);
  const [unit, setUnit] = useState("");
  const [rent, setRent] = useState("");
  const [due, setDue] = useState("");
  return (
    <div className="space-y-4">
      <p className="text-muted">
        سجل وحدات واستحقاقات محلي على جهازك. العقود والصيانة ومزامنة حساب أملاك ليست مدمجة.
      </p>
      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!unit.trim() || !Number.isFinite(Number(rent)) || Number(rent) < 0) return;
          setRows((v) => [
            ...v,
            { id: crypto.randomUUID(), unit: unit.trim(), rent: Number(rent), due },
          ]);
          setUnit("");
          setRent("");
        }}
      >
        <label>
          الوحدة
          <input
            required
            maxLength={120}
            className={field}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </label>
        <label>
          الإيجار المستحق (ريال)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            className={field}
            value={rent}
            onChange={(e) => setRent(e.target.value)}
          />
        </label>
        <label>
          تاريخ الاستحقاق
          <input
            required
            type="date"
            className={field}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>
        <button disabled={!ready} className={featureButton}>
          أضف الوحدة
        </button>
      </form>
      {rows.length === 0 && <p>أضف أول وحدة إلى سجلك.</p>}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
          >
            <span className="min-w-0 break-words">
              {row.unit} · {row.rent.toLocaleString("ar-SA")} ريال · {row.due}
            </span>
            <button
              className={featureButton}
              onClick={() => setRows((v) => v.filter((r) => r.id !== row.id))}
            >
              حذف {row.unit}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskDesk() {
  const [rows, setRows, ready] = usePersistent<Array<{ id: string; text: string; done: boolean }>>(
    "waha:agent:v1",
    [],
  );
  const [text, setText] = useState("");
  return (
    <div className="space-y-4">
      <p className="text-muted">
        قائمة تنفيذ محلية. لا يتصل هذا السجل بحساباتك ولا ينفذ مهامًا على مواقع أخرى.
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setRows((v) => [...v, { id: crypto.randomUUID(), text: text.trim(), done: false }]);
          setText("");
        }}
      >
        <label className="min-w-0 flex-1">
          المهمة
          <input
            required
            maxLength={500}
            className={field}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <button disabled={!ready} className={featureButton}>
          أضف المهمة
        </button>
      </form>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3">
              <input
                type="checkbox"
                checked={row.done}
                onChange={() =>
                  setRows((v) => v.map((r) => (r.id === row.id ? { ...r, done: !r.done } : r)))
                }
              />
              <span className={row.done ? "break-words line-through" : "break-words"}>
                {row.text}
              </span>
            </label>
            <button
              className={featureButton}
              onClick={() => setRows((v) => v.filter((r) => r.id !== row.id))}
            >
              حذف
            </button>
          </li>
        ))}
      </ul>
      <Link to="/ask" search={{ q: "" }} className={featureButton}>
        اسأل محسن عن خطتك
      </Link>
    </div>
  );
}

function ArabicAsset() {
  const [title, setTitle] = useState("فكرتك تبدأ هنا");
  const [color, setColor] = useState("#176b55");
  function download() {
    const escaped = title.replace(
      /[<>&"']/g,
      (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!,
    );
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="${color}"/><text x="600" y="330" text-anchor="middle" direction="rtl" font-family="sans-serif" font-size="64" fill="white">${escaped}</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "waha-card.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="space-y-4">
      <p className="text-muted">
        اصنع بطاقة عربية ونزّلها بصيغة SVG. كتالوج منبع التجاري وتراخيصه وتنزيلاته ليست منقولة هنا.
      </p>
      <label className="block">
        نص البطاقة
        <input
          className={field}
          maxLength={45}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="flex min-h-11 items-center gap-3">
        لون الخلفية
        <input
          aria-label="لون الخلفية"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
      <div
        className="flex min-h-48 items-center justify-center rounded-xl p-6 text-center text-3xl break-words text-white"
        style={{ background: color }}
      >
        {title}
      </div>
      <button className={featureButton} onClick={download}>
        تنزيل البطاقة SVG
      </button>
    </div>
  );
}

function Protection() {
  const [password, setPassword] = useState("");
  return (
    <div className="space-y-4">
      <p className="text-muted">
        إضافة حماية الأصلية تحجب التتبع في كروم وإيدج، وإدراجها بالمتجر ينتظر التحقق. صفحة واحة لا
        تحجب طلبات التطبيقات الأخرى.
      </p>
      <h2 className="text-xl">مولّد كلمة مرور على جهازك</h2>
      <button
        className={featureButton}
        onClick={() => {
          const bytes = crypto.getRandomValues(new Uint8Array(24));
          const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_";
          const limit = 256 - (256 % alphabet.length);
          let result = "";
          for (const byte of bytes) if (byte < limit) result += alphabet[byte % alphabet.length];
          while (result.length < 20) {
            const n = crypto.getRandomValues(new Uint8Array(1))[0];
            if (n < limit) result += alphabet[n % alphabet.length];
          }
          setPassword(result.slice(0, 20));
        }}
      >
        ولّد كلمة مرور
      </button>
      {password && (
        <output
          className="block rounded-lg border border-border p-4 font-mono break-all select-all"
          dir="ltr"
        >
          {password}
        </output>
      )}
      <p className="text-sm text-muted">
        لا تُحفظ كلمة المرور ولا تُرسل إلى خادم. انسخها إلى مدير كلمات المرور.
      </p>
    </div>
  );
}
