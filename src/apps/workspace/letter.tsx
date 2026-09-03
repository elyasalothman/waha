import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Seg } from "@/components/seg";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

const TEMPLATES = [
  {
    id: "offer",
    ar: "عرض",
    en: "Offer",
    body: "إشارة إلى تواصلنا، يسرّنا أن نقدم عرضنا لتنفيذ الأعمال الموضحة أدناه، وفق الشروط المتفق عليها، ولمدة صلاحية ثلاثين يوماً من تاريخه.",
  },
  {
    id: "notice",
    ar: "إشعار",
    en: "Notice",
    body: "نود إشعاركم بأن الالتزام المشار إليه أدناه قد استحق، ونرجو التكرم باستكمال اللازم خلال خمسة أيام عمل من تاريخ هذا الخطاب.",
  },
  {
    id: "thanks",
    ar: "شكر",
    en: "Thanks",
    body: "نشكر لكم حسن تعاونكم وثقتكم، ونتطلع إلى استمرار العمل المشترك بما يحقق مصلحة الطرفين.",
  },
  {
    id: "claim",
    ar: "مطالبة",
    en: "Claim",
    body: "نحيطكم علماً بأن المبلغ الموضح أدناه لا يزال معلّقاً، ونرجو تحويله على الحساب المعتمد مع إرفاق إيصال التحويل.",
  },
];

type Letter = {
  kind: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  city: string;
  date: string;
};

const empty: Letter = {
  kind: "offer",
  sender: "",
  recipient: "",
  subject: "",
  body: TEMPLATES[0]!.body,
  city: "الرياض",
  date: new Date().toISOString().slice(0, 10),
};

export function LetterApp() {
  const lang = useAppStore((s) => s.lang);
  const [v, setV] = usePersistent<Letter>("waha:letter", empty);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function setKind(id: string) {
    const tpl = TEMPLATES.find((x) => x.id === id);
    setV({ ...v, kind: id, body: tpl?.body ?? v.body });
  }

  return (
    <div className="space-y-4">
      <Seg
        lang={lang}
        value={v.kind}
        onChange={setKind}
        options={TEMPLATES.map((x) => ({ id: x.id, ar: x.ar, en: x.en }))}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={v.sender} onChange={(e) => setV({ ...v, sender: e.target.value })} placeholder={L("المرسل / المنشأة", "Sender")} />
        <Input value={v.recipient} onChange={(e) => setV({ ...v, recipient: e.target.value })} placeholder={L("الموجّه إليه", "Recipient")} />
        <Input value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} placeholder={L("المدينة", "City")} />
        <Input type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
      </div>
      <Input value={v.subject} onChange={(e) => setV({ ...v, subject: e.target.value })} placeholder={L("الموضوع", "Subject")} />
      <Textarea className="min-h-40" value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">
          {v.city} · {v.date}
        </p>
        <p className="mt-4 text-sm">{L("إلى", "To")}: {v.recipient || "—"}</p>
        <p className="mt-2 text-sm">{L("الموضوع", "Subject")}: {v.subject || "—"}</p>
        <p className="mt-6 leading-relaxed">{v.body}</p>
        <p className="mt-10 text-sm">{L("وتفضلوا بقبول فائق الاحترام", "Yours sincerely")}</p>
        <p className="mt-6 font-medium">{v.sender || "—"}</p>
      </div>
      <Button onClick={() => window.print()}>{t(lang, "print")}</Button>
    </div>
  );
}
