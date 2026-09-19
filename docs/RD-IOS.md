# قفل بحث وتطوير — شيل آيفون

المنتج للمتجر هو **تطبيق Capacitor / WKWebView**، ليس «أضف إلى الشاشة الرئيسية» وحده.

| # | القرار | في المستودع |
|---|---|---|
| 1 | Capacitor WKWebView للمتجر | `ios/` + `capacitor.config.ts` — A2HS يبقى للويب فقط |
| 2 | `viewport-fit=cover` + `env(safe-area-inset-*)` علوي/سفلي | `__root.tsx`، `html.native-ios .native-safe-top/bottom`، شريط التنقل |
| 3 | StatusBar + Keyboard.resize: **native** | `@capacitor/status-bar` و `@capacitor/keyboard` |
| 4 | لوحة عربية RTL قبل أي Submit لـ ASC | `dir=rtl` + `unicode-bidi: plaintext` على الحقول. Codemagic **لا** يرسل App Store. التحقق على جهاز قبل Submit |
| 5 | ليست غلافاً رقيقاً | إشعارات الصلاة عبر `LocalNotifications` / `UNUserNotificationCenter` — ليست Notification API في سفاري |
| 6 | نظام تشغيل البيت | تهجد / محسن / ألعاب / حياة عبر `@capacitor/browser` (SFSafariViewController) — لا تُفتح داخل WKWebView |

الاسم: **واحة**. Bundle: `com.alhajda.waha`.

إذن الإشعار يُطلب عند تفعيل «إشعار الصلاة القادمة» في تطبيق الآيفون (`requestSalahNotificationPermission`) — لا يُطلب على الويب ولا عند كل إقلاع.
