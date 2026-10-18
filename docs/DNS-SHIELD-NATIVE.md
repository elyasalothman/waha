# درع الإعلانات — مفتاح أصلي في تطبيق واحة iOS (نموذج أولي، فرع منفصل)

الفرع: `hark/dns-shield-native` — **لا يُدمج في `main` قبل موافقة إلياس**، لأن أي دفع إلى `main` يشغّل Codemagic `ios-release` ويرفع إلى TestFlight.

## ما في الفرع
- `ios/App/App/DnsShieldPlugin.swift`: إضافة Capacitor باسم `DnsShield` (status / enable / disable) فوق `NEDNSSettingsManager` مع `NEDNSOverHTTPSSettings` → `https://dns.alhajda.com/dns-query`، وقاعدة On-Demand تعمل على كل الشبكات.
- `ios/App/App/App.entitlements`: `com.apple.developer.networking.networkextension = [dns-settings]` (هذا هو مفتاح الصلاحية الصحيح لإعدادات DNS؛ لا يوجد مفتاح باسم `networking.dnssettings`).
- `CODE_SIGN_ENTITLEMENTS` في إعدادي Debug/Release، وتسجيل الإضافة في `WahaViewController.capacitorDidLoad`.
- الواجهة (على `main` ومنشورة): `src/apps/tools/shield.tsx` تكتشف `Capacitor.isPluginAvailable("DnsShield")`؛ إن وُجدت يصبح الزر «فعّل الحماية / أوقف الحماية» مفتاحًا أصليًا، وإلا تثبيت ملف التعريف عبر Safari.

## ما يلزم للشحن
1. developer.apple.com › Identifiers › `com.alhajda.waha` › فعّل **Network Extensions** (الفريق HQRPK78BRV). لا رسوم إضافية ضمن عضوية المطوّر.
2. إعادة توليد ملف التوقيع App Store (Codemagic يجلبه تلقائيًا بتكامل App Store Connect بعد تفعيل القدرة).
3. البناء على Xcode 26 وتجربة على جهاز حقيقي (المحاكي لا يطبّق إعدادات DNS): enable → الإعدادات › عام › الشبكة الخاصة الافتراضية وإدارة الجهاز › DNS › اختر «درع واحة» → افتح درع الإعلانات في واحة ويجب أن يظهر «✅ مفعّل».
4. مراجعة App Store: وصف الميزة في App Review Notes (تطبيق يضبط DNS مشفّر لحجب الإعلانات، بلا سجلات)، وتحديث ملصق الخصوصية: لا جمع بيانات.
5. دمج الفرع في `main` (يشغّل TestFlight) — بعد موافقة إلياس فقط.

## حدود صادقة
- iOS لا يسمح لأي تطبيق بتفعيل DNS بصمت: بعد الضغط يلزم اختيار «درع واحة» مرة واحدة من الإعدادات.
- لم يُبنَ الفرع هنا (لا يوجد Xcode في بيئة Hark)؛ الشيفرة لم تُترجم بعد.
- إذا كان ملف تعريف `درع الهجدة` مثبتًا أيضًا، يتعارض الإعدادان؛ اترك واحدًا.
