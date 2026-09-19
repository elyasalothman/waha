# قفل بحث وتطوير — شيل آيفون

المنتج للمتجر هو **تطبيق Capacitor / WKWebView**، ليس «أضف إلى الشاشة الرئيسية» وحده.

| # | القرار | في المستودع |
|---|---|---|
| 1 | Capacitor WKWebView للمتجر | `ios/` + `capacitor.config.ts` — A2HS يبقى للويب فقط |
| 2 | `viewport-fit=cover` + `env(safe-area-inset-*)` علوي/سفلي | `__root.tsx`، `html.native-ios .native-safe-top/bottom`، شريط التنقل |
| 3 | StatusBar + Keyboard.resize: **native** | `@capacitor/status-bar` و `@capacitor/keyboard` |
| 4 | لوحة عربية RTL قبل أي Submit لـ ASC | `dir=rtl` + `unicode-bidi: plaintext` على الحقول. Codemagic **لا** يرسل App Store. التحقق على جهاز قبل Submit |
| 5 | ليست غلافاً رقيقاً | إشعارات الصلاة عبر `LocalNotifications` / `UNUserNotificationCenter` — ليست Notification API في سفاري |
| 6 | نظام تشغيل البيت | أبواب البيت (مداد / تهجد / مواقعنا / محسن / ألعاب·لُمعة / حياة) داخل قشرة واحة عبر WKWebView وشريط «رجوع لواحة» — ليست Safari / SFSafari / `@capacitor/browser`. رف `/books` وروابط مداد تبقى داخل التطبيق. البوابات الرسمية فقط عبر Browser |

الاسم: **واحة**. Bundle: `com.alhajda.waha`. المضيف الحي المؤقت للقشرة: `waha.hajdah.com`.

إذن الإشعار يُطلب عند تفعيل «إشعار الصلاة القادمة» في تطبيق الآيفون (`requestSalahNotificationPermission`) — لا يُطلب على الويب ولا عند كل إقلاع.
