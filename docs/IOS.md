# واحة — قشرة Capacitor لآيفون

قشرة أصلية على نمط `products/mohsen-ios` في Main-Domain، مع مسار رفع سحابي مثل تهجد / حصتي لأن إلياس بلا ماك.

قرار البحث والتطوير مقفول في [RD-IOS.md](./RD-IOS.md): المتجر = WKWebView، ليس A2HS.

| | |
|---|---|
| الاسم على الشاشة | **واحة** (عربي) / **Waha** (إنجليزي) |
| Bundle ID | `com.alhajda.waha` |
| الفريق | `HQRPK78BRV` (الهجدة) |
| المجلد | `ios/App` — workspace + CocoaPods |
| الويب | `www/` بعد `npm run sync:www` |

## ماذا يحمّل التطبيق؟

`capacitor.config.ts`:

1. إن وُجد `CAPACITOR_SERVER_URL` أو `WAHA_IOS_SERVER_URL` وقت `cap sync` → WebView يفتح ذلك العنوان (إنتاج أو معاينة Vercel).
2. وإلا الحزمة المحلية `www/` (بناء العميل إن وُجد، وإلا `native/www-fallback`).

الاستضافة الحيّة المؤقتة: `https://waha.hajdah.com`. القشرة لا تنتظر اكتمال الويب ولا تعتمد على `waha.alhajda.com`.

```bash
npm ci
npm run sync:www
# اختياري — توجيه القشرة لموقع حيّ:
# WAHA_IOS_SERVER_URL=https://waha.hajdah.com npm run cap:sync
npx cap sync ios
```

`npx cap add ios` / `cap sync ios` على ماك Codemagic فقط إن أُعيد توليد المشروع. المجلد `ios/` محفوظ في Git لهذا السبب.

## آيفون: مناطق آمنة، RTL، شريط الحالة

- `viewport-fit=cover` + `env(safe-area-inset-*)` في الويب والقشرة
- `ios.contentInset: never` وشريط حالة داكن فوق الويب (`StatusBar.overlaysWebView`)
- `CFBundleDevelopmentRegion = ar` + `ar.lproj` / `en.lproj`
- `WahaViewController`: `semanticContentAttribute` عربي، `preferredStatusBarStyle = .lightContent`
- أبواب البيت (مداد / تهجد / مواقعنا / محسن / ألعاب / حياة): WKWebView داخل التطبيق (`HouseDoorBrowser`) مع زر «رجوع لواحة». البوابات الرسمية فقط عبر `@capacitor/browser`
- إذن `LocalNotifications` جاهز لتذكير الصلاة (يُطلب عند تفعيل المفتاح، لا عند الإقلاع)

## البناء السحابي

انظر [TESTFLIGHT.md](./TESTFLIGHT.md). لا أرشفة من ويندوز.
