import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";

function ymd(from: Date, to: Date) {
  let y = to.getFullYear() - from.getFullYear();
  let m = to.getMonth() - from.getMonth();
  let d = to.getDate() - from.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

export function DatesApp() {
  const lang = useAppStore((s) => s.lang);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [birth, setBirth] = useState("1995-01-01");
  const [a, setA] = useState(iso(new Date()));
  const [b, setB] = useState(iso(new Date()));
  const [base, setBase] = useState(iso(new Date()));
  const [add, setAdd] = useState(30);

  const age = useMemo(() => ymd(new Date(birth), new Date()), [birth]);
  const diff = useMemo(() => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000), [a, b]);
  const shifted = useMemo(() => {
    const d = new Date(base);
    d.setDate(d.getDate() + add);
    return iso(d);
  }, [base, add]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-medium">{lang === "ar" ? "العمر" : "Age"}</h2>
        <Input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
        <p className="mt-2 font-mono tabular-nums">
          {age.y} {lang === "ar" ? "سنة" : "y"} · {age.m} {lang === "ar" ? "شهر" : "m"} · {age.d} {lang === "ar" ? "يوم" : "d"}
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">{lang === "ar" ? "فرق الأيام" : "Day difference"}</h2>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={a} onChange={(e) => setA(e.target.value)} />
          <Input type="date" value={b} onChange={(e) => setB(e.target.value)} />
        </div>
        <p className="mt-2 font-mono tabular-nums">{diff} {lang === "ar" ? "يوم" : "days"}</p>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">{lang === "ar" ? "إضافة أيام" : "Add days"}</h2>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={base} onChange={(e) => setBase(e.target.value)} />
          <Input type="number" value={add} onChange={(e) => setAdd(Number(e.target.value))} />
        </div>
        <p className="mt-2 font-mono tabular-nums">{shifted}</p>
      </section>
    </div>
  );
}
