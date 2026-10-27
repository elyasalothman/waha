import { createFileRoute, Link } from "@tanstack/react-router";
import { DeleteAccount } from "@/components/delete-account";
import { PrivacyLinks } from "@/components/privacy-links";
import { clearWahaLocalData } from "@/lib/local-data";
import { useState } from "react";
export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "حذف حساب واحة والبيانات" },
      {
        name: "description",
        content: "حذف حساب واحة وبياناته، ومسح التخزين المحلي أو طلب الحذف بالبريد دون تسجيل دخول.",
      },
    ],
    links: [{ rel: "canonical", href: "https://waha.hajdah.com/delete-account" }],
  }),
  component: Page,
});
function Page() {
  const [status, setStatus] = useState("");
  return (
    <article dir="rtl" className="mx-auto max-w-3xl space-y-5 leading-8">
      <h1 className="font-display text-3xl">حذف الحساب والبيانات</h1>
      <p>هذه الصفحة عامة؛ لا تحتاج حسابًا لقراءة التعليمات أو طلب الحذف بالبريد.</p>
      <h2 className="text-xl">حذف حساب واحة</h2>
      <ol className="list-inside list-decimal space-y-3">
        <li>افتح «حسابي» وسجّل الدخول إلى حساب واحة الذي تريد حذفه.</li>
        <li>اختر «حذف حسابي»، وأدخل كلمة المرور لحساب البريد، أو أعد تسجيل الدخول إن لزم.</li>
        <li>اقرأ التأكيد وفعّله، ثم اضغط «تأكيد حذف حساب واحة».</li>
      </ol>
      <Link to="/me" className="inline-flex min-h-11 items-center text-primary underline">
        فتح حسابي ←
      </Link>
      <DeleteAccount />
      <p>
        يُحذف سجل الحساب والجلسات وكتبك المنشورة من قاعدة واحة عند نجاح الحذف. البيانات المحلية
        والكتب والملاحظات في جهازك مستقلة؛ امسحها بالزر أدناه. حسابات حصتي ومواقع البيت مستقلة ولا
        يحذفها هذا الإجراء. لا نَعِد بمدة محددة لنسخ احتياطية لدى مزود قاعدة البيانات؛ إن احتُفظ بها
        فتخضع لسياسة المزود ولا تُستخدم لتشغيل حسابك المحذوف. سجل الأسئلة المجهول لدى محسن لا يرتبط
        بمعرّف حسابك.
      </p>
      <h2 className="text-xl">لا تستطيع الدخول؟</h2>
      <p>
        أرسل طلبًا بعنوان «حذف حساب واحة» من بريد حسابك إلى{" "}
        <a
          href="mailto:elyasalothman@gmail.com?subject=حذف%20حساب%20واحة"
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          elyasalothman@gmail.com
        </a>
        . اذكر البريد المرتبط بالحساب وما تريد حذفه، بلا كلمة مرور أو هوية حساسة. نتحقق من ملكية
        الحساب قبل الحذف ونبلغك بالنتيجة؛ لا توجد مهلة معالجة مضمونة معلنة حاليًا.
      </p>
      <h2 className="text-xl">مسح بيانات هذا الجهاز</h2>
      <p>
        يمسح الإعدادات وسجل محسن وذاكرته والمفضلة والملاحظات والتذكيرات والكتب والصور المحلية ونسخ
        الأوفلاين. لا يحذف الحساب الخادمي. صدّر ما تحتاجه أولًا، وأغلق تبويبات واحة الأخرى.
      </p>
      <button
        className="min-h-12 rounded-xl border border-danger px-4 text-danger"
        onClick={() => {
          if (confirm("مسح جميع بيانات واحة المحلية بما فيها الكتب والسجل؟ لا يمكن التراجع."))
            void clearWahaLocalData().then(
              () => {
                setStatus("مُسحت بيانات واحة المحلية. أعد تحميل الصفحة.");
              },
              () => setStatus("تعذّر المسح؛ أغلق تبويبات واحة الأخرى وأعد المحاولة."),
            );
        }}
      >
        مسح بيانات واحة المحلية
      </button>
      <p role="status">{status}</p>
      <PrivacyLinks />
    </article>
  );
}
