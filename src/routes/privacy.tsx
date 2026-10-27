import { createFileRoute } from "@tanstack/react-router";
import { PrivacyLinks } from "@/components/privacy-links";
export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة خصوصية واحة" },
      {
        name: "description",
        content: "كيف تتعامل واحة مع البيانات المحلية والأسئلة والملفات والحساب والموقع.",
      },
    ],
    links: [{ rel: "canonical", href: "https://waha.hajdah.com/privacy" }],
  }),
  component: () => (
    <article dir="rtl" className="mx-auto max-w-3xl space-y-5 leading-8">
      <h1 className="font-display text-3xl">سياسة خصوصية واحة</h1>
      <p>سارية من 27 أكتوبر 2026 · واحة تجمع خدمات بيت الهجدة في مساحة واحدة.</p>
      <h2 className="text-xl">بيانات تبقى على جهازك</h2>
      <p>
        التفضيلات والمفضلة وآخر الخدمات والملاحظات والتذكيرات وذاكرة محسن وسجل محادثاته والكتب
        الخاصة تُحفظ محليًا في localStorage وIndexedDB. تبقى حتى تمسحها أو تحذف بيانات التطبيق.
        السجل غير مُزامن بين الأجهزة. الصور والملفات المرفقة لا تُضاف إلى سجل المحادثة المحفوظ؛ نزّل
        النتيجة للاحتفاظ بها.
      </p>
      <h2 className="text-xl">محسن والأسئلة والملفات</h2>
      <p>
        عند السؤال نرسل نصه لخدمة محسن على si.alhajda.com عبر خادم واحة، ومع المتابعة آخر رسالتين
        فقط. التحليل والصور و«حقّق» تتصل بالخدمة مباشرة؛ يُرسل الملف والسؤال أو الوصف فقط، بلا معرّف
        حساب واحة أو ذاكرته. الملفات تُعالج في الذاكرة ولا تُخزّن لدى العامل؛ ونصوص حقّق لا تُخزّن
        لديه. قد تُسجّل الأسئلة غير المجاب عنها مجهولة لتحسين محسن؛ لا نَعِد بمدة حذف لهذا السجل غير
        محددة من الخدمة. عدادات الحصة تستخدم تجزئة عنوان الشبكة واليوم، وتنتهي بعد يومين. يحفظ
        المتصفح المحادثات إلى أن تمسحها؛ لا ترسل معلومات حساسة لا تحتاجها المهمة.
      </p>
      <h2 className="text-xl">الموقع والإشعارات</h2>
      <p>
        اختيار المدينة محلي. لا نطلب الموقع إلا بإذنك للطقس والخدمات التي تحتاجه؛ قد تُرسل
        الإحداثيات إلى مصدر الطقس Open-Meteo. تستطيع رفض الإذن واختيار مدينة. التذكيرات والإشعارات
        المحلية اختيارية وتحتاج إذن الجهاز؛ لا ضمان لوصولها بعد إغلاق التطبيق على جميع المنصات.
      </p>
      <h2 className="text-xl">الحساب والخدمات الأخرى</h2>
      <p>
        الحساب اختياري عبر Better Auth عند تفعيله. تُخزّن بيانات الهوية والجلسات والكتب التي تختار
        نشرها في قاعدة الحساب، وتُستخدم ملفات جلسة ضرورية للدخول. خدمات البيت والروابط الخارجية لها
        حسابات وسياسات مستقلة؛ فتح رابط يرسل بيانات الاتصال المعتادة لذلك الموقع. لا تتضمن واحة
        دفعًا أو تداولًا حقيقيًا؛ روبوت السوق افتراضي.
      </p>
      <h2 className="text-xl">القياس والأطفال</h2>
      <p>
        نستخدم Cloudflare Web Analytics بلا كوكيز لقياس الاستخدام والأداء. لا نبيع البيانات ولا نعرض
        إعلانات. يمكن استخدام واحة دون حساب؛ لا نطلب بيانات طفل عمدًا. على ولي الأمر الإشراف على
        استخدام الذكاء الاصطناعي والخدمات الخارجية وطلب إزالة أي بيانات أُرسلت دون قصد.
      </p>
      <h2 className="text-xl">حقوقك والتواصل</h2>
      <p>
        يمكنك مسح السجل أو البيانات المحلية من الإعدادات، وحذف الحساب أو طلب المساعدة عبر{" "}
        <a
          className="inline-flex min-h-11 items-center text-primary underline"
          href="mailto:elyasalothman@gmail.com"
        >
          elyasalothman@gmail.com
        </a>
        . عند تحديث السياسة نحدّث تاريخ السريان هنا.
      </p>
      <PrivacyLinks />
      <section dir="ltr" lang="en">
        <h2 className="text-xl">English summary</h2>
        <p>
          Effective October 27, 2026. Waha stores preferences, books, notes, favorites and chat
          history on your device until you clear them. Mohsen receives your question and at most two
          prior messages; uploads and generation go directly to si.alhajda.com. Uploaded files are
          processed in memory, not stored by the worker. Unanswered questions may be logged
          anonymously to improve Mohsen; no fixed retention period is promised. Quota hashes expire
          after two days. Location and notifications require permission. Optional accounts use
          Better Auth. External services have separate policies. Cloudflare Web Analytics uses no
          cookies. No advertising or data sales. Children should use AI with parental guidance. For
          deletion or privacy requests: elyasalothman@gmail.com.
        </p>
      </section>
    </article>
  ),
});
