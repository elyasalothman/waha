# قفل بحث وتطوير — شيل آيفون

المنتج للمتجر هو **تطبيق Capacitor / WKWebView**، ليس «أضف إلى الشاشة الرئيسية» وحده.

| # | القرار | في المستودع |
|---|---|---|
| 1 | Capacitor WKWebView للمتجر | `ios/` + `capacitor.config.ts` — A2HS يبقى للويب فقط |
| 2 | `viewport-fit=cover` + `env(safe-area-inset-*)` علوي/سفلي | `__root.tsx`، `html.native-ios .native-safe-top/bottom`، شريط التنقل |
| 3 | StatusBar + Keyboard.resize: **native** | `@capacitor/status-bar` و `@capacitor/keyboard` |
| 4 | لوحة عربية RTL قبل أي Submit لـ ASC | `dir=rtl` + `unicode-bidi: plaintext` على الحقول. Codemagic **لا** يرسل App Store. التحقق على جهاز قبل Submit |
| 5 | ليست غلافاً رقيقاً | إشعارات الصلاة عبر `LocalNotifications` / `UNUserNotificationCenter` — ليست Notification API في سفاري |

الاسم: **واحة**. Bundle: `com.alhajda.waha`.
