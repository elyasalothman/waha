# نشر «واحة للكمبيوتر» — ما المطلوب

تحقق في 18 أكتوبر 2026. لا شيء هنا دُفع أو قُدِّم؛ كل خطوة تحتاج قرار إلياس.

## الوضع الحالي
- CI يبني حزمًا **غير موقّعة**: ويندوز `.msi` و`.exe` (NSIS)، ماك `.dmg` Universal، لينكس `.deb`/`.AppImage`.
- ويندوز: SmartScreen يُظهر «Windows protected your PC» ← «More info» ← «Run anyway».
- ماك: Gatekeeper يرفض الفتح بنقرتين. الحل للمختبرين: زر الفأرة الأيمن ← «فتح»، أو إعدادات النظام ← الخصوصية والأمان ← «افتح على أي حال». على macOS 15+ قد يلزم `xattr -dr com.apple.quarantine "/Applications/Waha Desktop.app"`.
- مثبّت ويندوز يستخدم مُحمّل WebView2 الافتراضي (يحمّله إن لم يكن موجودًا؛ ويندوز 11 فيه WebView2 مسبقًا).

## Microsoft Store
1. **الحساب**: حساب Microsoft Edge Add-ons الحالي مسجّل في برنامج «Microsoft Edge» داخل Partner Center، وهذا لا يكفي وحده لنشر تطبيقات ويندوز؛ يلزم تفعيل برنامج **Apps & Games (Windows & Xbox)**. ابدأ من https://storedeveloper.microsoft.com بنفس حساب Microsoft (MSA) المستخدم لحساب Edge؛ حسب وثائق مايكروسوفت المطوّر الموجود يتخطى خطوات التحقق ويُنقل مباشرة إلى لوحة Apps & Games (أو مباشرة https://aka.ms/submitwindowsapp).
2. **الرسوم**: حساب الأفراد **مجاني** (منذ سبتمبر 2025، مع تحقق بالهوية الحكومية وصورة سيلفي). حساب الشركات مجاني عبر المسار الجديد (تذكر بعض صفحات مايكروسوفت 99$ لمرة واحدة للشركات في المسار القديم). المصادر: https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account ، https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store
3. **مسار الحزمة — خياران**:
   - **MSIX (موصى به)**: المتجر يعيد توقيع الحزمة مجانًا، تحديثات تلقائية، لا حاجة لشهادة. Tauri لا يُخرج MSIX مباشرة؛ نحوّل ناتج البناء بأداة MSIX Packaging Tool أو `winapp`/`makeappx` في CI (عمل لاحق: سطر في workflow). https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements
   - **MSI/EXE كما هو**: يتطلب توقيع المثبّت وكل ملفات PE بشهادة توقيع كود من جهة ضمن Microsoft Trusted Root Program (مدفوعة؛ Azure Artifact Signing ~9.99$/شهر لكنها للأفراد في أمريكا وكندا فقط)، ورابط HTTPS ثابت بإصدار (مثل `https://waha.hajdah.com/desktop/0.1.0/waha.msi`)، ومثبّت **دون تنزيل أثناء التثبيت** (يجب تغيير WebView2 إلى `offlineInstaller` أو `skip`). https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-package-requirements
4. في Partner Center: حجز الاسم «واحة للكمبيوتر»، سياسة خصوصية (يمكن استخدام صفحة الخصوصية في hajdah.com)، لقطات شاشة، الفئة Productivity، تصنيف عمري، ثم التقديم.

## Mac App Store / التوثيق (Notarization)
الحساب: Apple Developer Program (99$/سنة) — موجود لدى إلياس.
- **توزيع مباشر خارج المتجر (أسهل خطوة تالية)**: شهادة «Developer ID Application» من حسابه + كلمة مرور خاصة بالتطبيقات أو مفتاح App Store Connect API. أسرار GitHub المطلوبة لـ tauri-action: `APPLE_CERTIFICATE` (p12 base64)، `APPLE_CERTIFICATE_PASSWORD`، `APPLE_SIGNING_IDENTITY`، و`APPLE_ID` + `APPLE_PASSWORD` + `APPLE_TEAM_ID` (أو `APPLE_API_KEY`/`APPLE_API_ISSUER`/`APPLE_API_KEY_PATH`). عندها يوقّع ويوثّق CI الـ dmg تلقائيًا ويختفي تحذير Gatekeeper. https://v2.tauri.app/distribute/sign/macos/
- **Mac App Store**: شهادتا «Apple Distribution» و«Mac Installer Distribution»، Bundle ID مسجّل (`com.hajdah.waha.desktop`)، ملف Provisioning Profile للماك، تفعيل App Sandbox بصلاحيات `com.apple.security.files.user-selected.read-write` (يكفي لأن الفتح/الحفظ عبر نوافذ النظام)، بناء `--bundles app` ثم `productbuild` إلى `.pkg` ورفعه عبر Transporter/`altool`، وإنشاء سجل التطبيق في App Store Connect. https://v2.tauri.app/distribute/app-store/
- لم تُنشأ أي شهادة أو مفتاح؛ هذا يحتاج موافقته (مفاتيح جديدة).

## ويندوز خارج المتجر
لإزالة تحذير SmartScreen عند التوزيع من الموقع: شهادة توقيع كود (OV/EV) من جهة موثوقة، ثم `bundle.windows.certificateThumbprint` أو `signCommand` في `tauri.conf.json`. مسار المتجر عبر MSIX يغني عن ذلك.
