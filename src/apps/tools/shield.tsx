import { useCallback, useEffect, useMemo, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { featureButton } from "@/lib/share-card";
import {
  SHIELD_DOH_URL,
  SHIELD_PAGE_URL,
  checkDomain,
  detectShieldPlatform,
  probeShield,
  profileOpenHref,
  type ShieldPlatform,
  type ShieldStatus,
} from "@/lib/dns-shield";

/** Optional native toggle (NEDNSSettingsManager) — present only in builds that ship the
 *  DnsShield plugin + DNS-settings entitlement. Without it we install the profile via Safari. */
interface DnsShieldPlugin {
  status(): Promise<{ enabled: boolean }>;
  enable(opts: { serverURL: string }): Promise<{ enabled: boolean }>;
  disable(): Promise<{ enabled: boolean }>;
}
const DnsShield = registerPlugin<DnsShieldPlugin>("DnsShield");
const hasNativeToggle = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("DnsShield");

function usePlatform(): ShieldPlatform {
  return useMemo(() => {
    if (typeof navigator === "undefined") return "desktop";
    const standalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      (typeof matchMedia !== "undefined" && matchMedia("(display-mode: standalone)").matches);
    return detectShieldPlatform(navigator.userAgent, {
      maxTouchPoints: navigator.maxTouchPoints,
      standalone,
      native: Capacitor.isNativePlatform(),
    });
  }, []);
}

const STATUS_TEXT: Record<ShieldStatus | "checking", string> = {
  checking: "⏳ نفحص جهازك…",
  active: "✅ الدرع مفعّل — الإعلانات والمتتبعات محجوبة",
  inactive: "⚪️ الدرع غير مفعّل على هذا الجهاز",
  unknown: "❔ تعذّر الفحص (تحقق من الاتصال)",
};

export function ShieldApp() {
  const platform = usePlatform();
  const native = hasNativeToggle();
  const [status, setStatus] = useState<ShieldStatus | "checking">("checking");
  const [nativeOn, setNativeOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [domain, setDomain] = useState("googleads.g.doubleclick.net");
  const [verdict, setVerdict] = useState("");
  const [opened, setOpened] = useState(false);

  const refresh = useCallback(async () => {
    setStatus("checking");
    if (native) {
      try {
        setNativeOn((await DnsShield.status()).enabled);
      } catch {
        /* keep previous */
      }
    }
    setStatus(await probeShield());
  }, [native]);

  useEffect(() => {
    void refresh();
    const onVis = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const ios = platform.startsWith("ios");
  const applePlatform = ios || platform === "mac-safari";

  const activate = async (family = false) => {
    setMsg("");
    if (native && !family) {
      setBusy(true);
      try {
        const r = nativeOn ? await DnsShield.disable() : await DnsShield.enable({ serverURL: SHIELD_DOH_URL });
        setNativeOn(r.enabled);
        if (r.enabled) setMsg("بقيت خطوة: الإعدادات › عام › الشبكة الخاصة الافتراضية وإدارة الجهاز › DNS › اختر «واحة».");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "تعذّر التفعيل");
      } finally {
        setBusy(false);
        setTimeout(() => void refresh(), 1500);
      }
      return;
    }
    setOpened(true);
    window.location.href = profileOpenHref(platform, family);
  };

  const runCheck = async () => {
    setVerdict("…");
    try {
      const v = await checkDomain(domain);
      setVerdict(v === "block" ? `⛔ محجوب: ${domain}` : `✅ مسموح: ${domain}`);
    } catch {
      setVerdict("اكتب نطاقًا صحيحًا مثل ads.example.com");
    }
  };

  return (
    <div className="space-y-4" data-shield-app>
      <section className="space-y-3 rounded-2xl border border-border p-5">
        <div className="text-4xl" aria-hidden>
          🛡️
        </div>
        <h2 className="font-display text-2xl">درع الإعلانات</h2>
        <p className="text-muted">
          DNS مشفّر من الهجدة يحجب الإعلانات والمتتبعات والمواقع الضارة على مستوى الجهاز كله — في
          المتصفح والتطبيقات — مجانًا وبلا تسجيل لما تتصفحه.
        </p>
        <p className="text-lg font-semibold" data-shield-status={status} aria-live="polite">
          {STATUS_TEXT[status]}
        </p>

        {applePlatform || native ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void activate()}
              className="block w-full rounded-2xl bg-primary px-5 py-4 text-center text-lg font-bold text-primary-foreground disabled:opacity-60"
              data-shield-activate
            >
              {native && nativeOn ? "أوقف الحماية" : "فعّل الحماية"}
            </button>
            {!native && (
              <ol className="list-decimal space-y-1 ps-6 text-sm" data-shield-steps>
                {platform !== "ios-safari" && platform !== "mac-safari" && (
                  <li>سيفتح Safari ويطلب تنزيل ملف التعريف — اضغط «سماح».</li>
                )}
                {platform === "mac-safari" ? (
                  <li>افتح الملف المنزّل ثم إعدادات النظام › الخصوصية والأمن › ملفات التعريف › تثبيت.</li>
                ) : (
                  <>
                    <li>
                      افتح <b>الإعدادات › تم تنزيل ملف التعريف</b>.
                    </li>
                    <li>
                      اضغط <b>تثبيت</b> وأدخل رمز الجهاز، ثم ارجع هنا لترى الحالة.
                    </li>
                  </>
                )}
              </ol>
            )}
            {opened && platform === "ios-other" && (
              <p className="text-sm text-muted">
                إن لم يفتح Safari: انسخ الرابط وافتحه في Safari:{" "}
                <span dir="ltr" className="break-all font-mono">
                  {profileOpenHref("ios-safari")}
                </span>
              </p>
            )}
            {msg && <p className="text-sm">{msg}</p>}
            <p className="text-xs text-muted">
              سيظهر الملف «غير موثّق» لأنه غير موقّع رقميًا، وهذا متوقع. للإيقاف: الإعدادات › عام ›
              الشبكة الخاصة الافتراضية وإدارة الجهاز › احذف «درع الهجدة».
            </p>
            <button type="button" className={featureButton} onClick={() => void activate(true)}>
              نسخة عائلية (تحجب المحتوى الإباحي أيضًا)
            </button>
          </>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              {platform === "android"
                ? "أندرويد: «DNS الخاص» في النظام يدعم DoT فقط ولا يعمل مع الدرع. فعّله في Chrome: الإعدادات › الخصوصية والأمان › الأمان › استخدام DNS آمن › مخصص، أو استخدم تطبيق Intra / Rethink DNS."
                : "على الكمبيوتر: فعّله في المتصفح — Chrome/Edge: الإعدادات › الخصوصية › الأمان › استخدام DNS آمن › مخصص. Firefox: الإعدادات › الخصوصية › DNS عبر HTTPS › أقصى حماية › مخصص."}
            </p>
            <p>
              العنوان:{" "}
              <span dir="ltr" className="select-all break-all font-mono">
                {SHIELD_DOH_URL}
              </span>
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={featureButton} onClick={() => void refresh()}>
            أعد الفحص
          </button>
          <a className={featureButton} href={SHIELD_PAGE_URL} target="_blank" rel="noopener noreferrer">
            كل الأجهزة والتفاصيل
          </a>
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-border p-5">
        <h3 className="font-semibold">هل هذا النطاق محجوب؟</h3>
        <div className="flex gap-2">
          <input
            dir="ltr"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            autoCapitalize="off"
            spellCheck={false}
            inputMode="url"
            className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-3"
            aria-label="النطاق"
          />
          <button type="button" className={featureButton} onClick={() => void runCheck()}>
            افحص
          </button>
        </div>
        {verdict && <p className="font-semibold">{verdict}</p>}
        <p className="text-xs text-muted">
          القائمة: HaGeZi Multi PRO (أكثر من 200 ألف نطاق) مع استثناء أبشر وتوكلنا ونفاذ والبنوك وواتساب
          وخدمات أبل.
        </p>
      </section>
    </div>
  );
}
