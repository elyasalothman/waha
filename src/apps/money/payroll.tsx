import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Emp = { id: string; name: string; basic: number; housing: number; other: number; saudi: boolean };

function gosi(e: Emp) {
  const wage = Math.min(45000, Math.max(0, e.basic + e.housing));
  const employee = e.saudi ? wage * 0.0975 : 0;
  const employer = e.saudi ? wage * 0.1175 : wage * 0.02;
  const gross = e.basic + e.housing + e.other;
  return { wage, employee, employer, gross, net: gross - employee, company: gross + employer };
}

export function PayrollApp() {
  const lang = useAppStore((s) => s.lang);
  const [rows, setRows] = usePersistent<Emp[]>("waha:payroll", []);
  const [name, setName] = useState("");
  const [basic, setBasic] = useState("4000");
  const [housing, setHousing] = useState("1000");
  const [saudi, setSaudi] = useState(true);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, e) => {
        const g = gosi(e);
        acc.net += g.net;
        acc.company += g.company;
        acc.employee += g.employee;
        acc.employer += g.employer;
        return acc;
      },
      { net: 0, company: 0, employee: 0, employer: 0 },
    );
  }, [rows]);
  const nf = (n: number) => n.toLocaleString(lang === "ar" ? "ar-SA" : "en-SA", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-xs text-muted">{L("صافي الفريق", "Team net")}</p>
          <p className="mt-1 font-mono text-xl tabular-nums">{nf(totals.net)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-xs text-muted">{L("تكلفة المنشأة", "Company cost")}</p>
          <p className="mt-1 font-mono text-xl tabular-nums">{nf(totals.company)}</p>
        </div>
      </div>
      <form
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setRows([
            {
              id: crypto.randomUUID(),
              name: name.trim(),
              basic: Number(basic) || 0,
              housing: Number(housing) || 0,
              other: 0,
              saudi,
            },
            ...rows,
          ]);
          setName("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={L("الموظف", "Employee")} />
        <Input type="number" value={basic} onChange={(e) => setBasic(e.target.value)} placeholder={L("الأساسي", "Basic")} />
        <Input type="number" value={housing} onChange={(e) => setHousing(e.target.value)} placeholder={L("السكن", "Housing")} />
        <button
          type="button"
          onClick={() => setSaudi((s) => !s)}
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm"
        >
          {saudi ? L("مواطن", "Saudi") : L("غير مواطن", "Non-Saudi")}
        </button>
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <p className="text-xs text-subtle">
        {L("مواطن: ٩٫٧٥٪ على الموظف و١١٫٧٥٪ على المنشأة. غير مواطن: ٢٪ مخاطر مهنية على المنشأة. سقف الأجر الخاضع ٤٥٬٠٠٠.", "Saudi: 9.75% employee and 11.75% employer. Non-Saudi: 2% occupational hazards on the employer. Contributory cap 45,000.")}
      </p>
      <ul className="space-y-2">
        {rows.map((e) => {
          const g = gosi(e);
          return (
            <li key={e.id} className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted">{e.saudi ? L("مواطن", "Saudi") : L("غير مواطن", "Non-Saudi")}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((x) => x.id !== e.id))}>
                  {t(lang, "delete")}
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <p>{L("الصافي", "Net")} {nf(g.net)}</p>
                <p>{L("خصم الموظف", "Employee")} {nf(g.employee)}</p>
                <p>{L("حصة المنشأة", "Employer")} {nf(g.employer)}</p>
                <p>{L("التكلفة", "Cost")} {nf(g.company)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
