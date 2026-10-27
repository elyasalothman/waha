import { PrivacyLinks } from "@/components/privacy-links";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpLeft,
  BookOpen,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  WifiOff,
  Moon,
  Newspaper,
  Gamepad2,
  GraduationCap,
} from "lucide-react";
import { WahaWordmark } from "@/components/brand";
import { DesktopDownloadLink } from "@/components/desktop-download";

const pillars = [
  {
    title: "ديني",
    label: "سكينة في زحمة اليوم",
    text: "مصحفك، وردك، ومواقيت الصلاة. مساحة تعود فيها إلى ما يطمئنك.",
    image: "quran",
    href: "/quran",
    Icon: Moon,
  },
  {
    title: "أخبار",
    label: "اعرف ما يجري، بهدوء",
    text: "عناوين عربية من مصادرها، وموجز آلي تستطيع الاستماع إليه.",
    image: "news",
    href: "/news",
    Icon: Newspaper,
  },
  {
    title: "ممتع",
    label: "استراحة تستحقها",
    text: "ألعاب واحة، وعالم لُمعة ولعبة حياة. وقت خفيف لك وللعائلة.",
    image: "games",
    href: "/games",
    Icon: Gamepad2,
  },
  {
    title: "تعلّم",
    label: "صفحة تفتح لك بابًا",
    text: "مكتبة مداد، قراءة تحفظ موضعك، واستوديو يحوّل نصوصك إلى كتب.",
    image: "books",
    href: "/books",
    Icon: GraduationCap,
  },
];
const features = [
  {
    Icon: Sparkles,
    title: "محسن، قريب من سؤالك",
    text: "محادثة عربية مع مساعد البيت بالذكاء الاصطناعي. راجع المصادر وأهل الاختصاص فيما يحتاج ذلك.",
  },
  {
    Icon: Newspaper,
    title: "بث الأخبار المسموع",
    text: "موجز آلي استخراجي من العناوين، مع المصدر ووقت التحديث.",
  },
  {
    Icon: BookOpen,
    title: "من قارئ إلى صانع كتاب",
    text: "اقرأ مكتبة مداد، أو حوّل ملفاتك إلى مسودة خاصة على جهازك في استوديو الكتب.",
  },
  {
    Icon: GraduationCap,
    title: "حصتي للمعلمين",
    text: "بوابتك إلى حصتي ضمن مواقع البيت، لتصل إلى أدوات التدريس من مكان واحد.",
  },
  {
    Icon: SlidersHorizontal,
    title: "واحة على ذوقك",
    text: "اختر اهتماماتك، وخصّص المدينة واللغة وتجربة القراءة. تفضيلاتك المحلية تبقى على هذا المتصفح.",
  },
  {
    Icon: WifiOff,
    title: "خصوصية ومساحة دون اتصال",
    text: "كتبك الخاصة وتفضيلاتك محلية. بعض الصفحات التي زرتها متاحة دون اتصال؛ الأخبار ومحسن يحتاجان الإنترنت.",
  },
];
export function WelcomePage() {
  return (
    <div className="landing" dir="rtl" lang="ar">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 focus:rounded-xl focus:bg-white focus:p-4"
      >
        تجاوز إلى المحتوى
      </a>
      <header className="landing-nav">
        <Link to="/welcome" aria-label="واحة، الصفحة التعريفية">
          <WahaWordmark lang="ar" />
        </Link>
        <nav aria-label="تنقل الصفحة التعريفية">
          <a href="#discover">اكتشف واحة</a>
          <Link to="/register" search={{ mode: "signin" }}>
            دخول
          </Link>
          <Link className="landing-button small" to="/register" search={{ mode: "signup" }}>
            سجّل مجانًا
          </Link>
        </nav>
      </header>
      <main id="main-content">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">
              <span /> من بيت الهجدة، ليومك
            </p>
            <h1>
              يومك كله
              <br />
              في <span>واحة.</span>
            </h1>
            <p className="landing-intro">
              بين ما يُلهمك وما ينفعك، مساحة عربية تجمع تفاصيل يومك. اقرأ، تعلّم، العب… وخذ نفسًا.
            </p>
            <div className="landing-actions">
              <Link className="landing-button" to="/register" search={{ mode: "signup" }}>
                سجّل مجانًا <ArrowUpLeft size={20} />
              </Link>
              <Link className="landing-secondary" to="/onboarding">
                ابدأ وخصّص واحتك <ArrowUpLeft size={18} />
              </Link>
              <DesktopDownloadLink />
            </div>
            <p className="landing-note">
              <ShieldCheck size={16} /> ابدأ كضيف، وخصّص واحتك متى أحببت.
            </p>
          </div>
          <div className="landing-scene" aria-label="لقطة حقيقية من مصحف واحة">
            <div className="landing-orbit orbit-one" />
            <div className="landing-orbit orbit-two" />
            <span className="landing-scene-word">قليلٌ من السكينة</span>
            <div className="landing-phone">
              <img
                src="/landing/quran.jpg"
                width="390"
                height="700"
                alt="مصحف واحة: سور القرآن واختيار القارئ وحفظ موضع القراءة"
                fetchPriority="high"
              />
            </div>
            <div className="landing-float">
              <Moon size={22} />
              <span>
                وقتٌ لنفسك.
                <br />
                <strong>ومكانٌ لكل يوم.</strong>
              </span>
            </div>
          </div>
        </section>
        <div className="landing-baloot">
          <span>♠ جديد لجمعتكم</span>
          <p>البلوت عليكم، والحساب على واحة.</p>
          <Link to="/app/$id" params={{ id: "baloot" }}>
            افتح حاسبة البلوت <ArrowUpLeft size={18} />
          </Link>
        </div>
        <div className="landing-ribbon">
          <span>عربية من القلب</span>
          <i /> <span>للجوال وللكمبيوتر</span>
          <i />
          <span>منظومة واحدة، أبواب كثيرة</span>
        </div>
        <section id="discover" className="landing-section">
          <p className="landing-eyebrow">أربعة أبواب، واحة واحدة</p>
          <h2>كل ما تحب أن يعود إليه يومك.</h2>
          <p className="landing-section-intro">ابدأ من حيث أنت. لكل لحظة في يومك مساحة هنا.</p>
          <div className="landing-pillars">
            {pillars.map(({ Icon, ...p }) => (
              <a href={p.href} className={`landing-pillar pillar-${p.image}`} key={p.image}>
                <div className="landing-pillar-copy">
                  <span className="landing-pillar-label">
                    <Icon size={18} />
                    {p.title}
                    <ArrowUpLeft size={18} />
                  </span>
                  <h3>{p.label}</h3>
                  <p>{p.text}</p>
                </div>
                <div className="landing-shot">
                  <img
                    src={`/landing/${p.image}.jpg`}
                    width="390"
                    height="700"
                    alt={`لقطة حقيقية من ${p.title} في واحة`}
                    loading="lazy"
                  />
                </div>
              </a>
            ))}
          </div>
        </section>
        <section className="landing-features">
          <div className="landing-section">
            <p className="landing-eyebrow">تفاصيل تصنع الفرق</p>
            <h2>أقل تشتتًا. أكثر قربًا منك.</h2>
            <div className="landing-feature-grid">
              {features.map(({ Icon, title, text }) => (
                <article key={title}>
                  <Icon size={25} strokeWidth={1.5} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="landing-section landing-house">
          <div>
            <p className="landing-eyebrow">أهلًا بك في البيت</p>
            <h2>تطبيقاتك في واحة.</h2>
            <p>أدوات للكتابة والقرار والعبادة واللعب، تفتحها وتعود منها في المكان نفسه.</p>
            <Link className="landing-secondary" to="/app/$id" params={{ id: "sites" }}>
              اكتشف تطبيقات واحة <ArrowUpLeft size={18} />
            </Link>
          </div>
        </section>
        <section className="landing-section landing-faq">
          <p className="landing-eyebrow">قبل أن تبدأ</p>
          <h2>قد يدور في بالك.</h2>
          {[
            [
              "هل أحتاج حسابًا لاستخدام واحة؟",
              "يمكنك تجربة القرآن والأخبار والألعاب والكتب العامة دون حساب. سجّل لحفظ حسابك، وتبقى تفضيلاتك الشخصية محفوظة على جهازك.",
            ],
            [
              "هل موجز الأخبار بالذكاء الاصطناعي؟",
              "الموجز الحالي آلي استخراجي من عناوين المصادر، وليس مولّدًا بالذكاء الاصطناعي. محسن هو مساعد المحادثة بالذكاء الاصطناعي. راجع المصدر دائمًا.",
            ],
            [
              "هل تعمل واحة دون إنترنت؟",
              "بعض الصفحات العامة التي سبق أن زرتها تُحفظ للاستخدام دون اتصال، وكتبك المحلية تبقى على جهازك. لا يشمل ذلك كل المحتوى أو الأخبار والمحادثة الحية.",
            ],
            [
              "أين تُحفظ كتبي وتفضيلاتي؟",
              "مسودات الكتب والرف الخاص وإعدادات القراءة محفوظة محليًا في متصفحك؛ حذف بيانات المتصفح قد يحذفها. نشر الكتب للعامة يحتاج إعداد الخدمة وصلاحية مدير.",
            ],
            [
              "هل يوجد تطبيق آيفون؟",
              "استخدم واحة على آيفون من المتصفح وأضفها إلى الشاشة الرئيسية.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section className="landing-final">
          <span className="landing-eyebrow">مساحة ليوم أجمل</span>
          <h2>اجعل ليومك واحة.</h2>
          <p>خطوة صغيرة، وأبواب كثيرة تستحق الاكتشاف.</p>
          <div className="landing-actions">
            <Link className="landing-button" to="/register" search={{ mode: "signup" }}>
              سجّل مجانًا <ArrowUpLeft size={20} />
            </Link>
            <Link className="landing-secondary" to="/onboarding">
              ابدأ وخصّص واحتك
            </Link>
            <DesktopDownloadLink />
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <PrivacyLinks />
        <WahaWordmark lang="ar" />
        <p>من بيت الهجدة · صُنعت لتكون قريبة منك.</p>
        <Link to="/onboarding">
          إلى يومي <ArrowUpLeft size={16} />
        </Link>
      </footer>
    </div>
  );
}
