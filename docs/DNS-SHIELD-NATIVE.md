# درع الإعلانات — مفتاح أصلي في تطبيق واحة iOS

وافق إلياس (30 أكتوبر 2026) على الشحن إلى **TestFlight أولًا** (أندرويد لاحقًا). دُمج الفرع `hark/dns-shield-native` في `main`، وهذا يشغّل Codemagic `ios-release` → TestFlight. **لا إرسال لمراجعة App Store** دون موافقة منفصلة.

## الحالة في Apple (30 أكتوبر 2026)
- App ID `com.alhajda.waha`: قدرة **Network Extensions** مفعّلة.
- ملف التوقيع «Waha App Store» (8Z3U3563ZN) أُعيد توليده ويشمل Network Extensions، واستُبدل في Codemagic (Code signing identities).

## ما في الفرع
- `ios/App/App/DnsShieldPlugin.swift`: إضافة Capacitor باسم `DnsShield` (status / enable / disable) فوق `NEDNSSettingsManager` مع `NEDNSOverHTTPSSettings` → `https://dns.alhajda.com/dns-query` (أو `/family/dns-query` للنسخة العائلية؛ لا يقبل غير هذين المسارين على dns.alhajda.com)، وقاعدة On-Demand تعمل على كل الشبكات.
- `ios/App/App/App.entitlements`: `com.apple.developer.networking.networkextension = [dns-settings]` (هذا هو مفتاح الصلاحية الصحيح لإعدادات DNS؛ لا يوجد مفتاح باسم `networking.dnssettings`).
- `CODE_SIGN_ENTITLEMENTS` في إعدادي Debug/Release، وتسجيل الإضافة في `WahaViewController.capacitorDidLoad`.
- الواجهة (على `main` ومنشورة): `src/apps/tools/shield.tsx` تكتشف `Capacitor.isPluginAvailable("DnsShield")`؛ إن وُجدت يصبح الزر مفتاحًا أصليًا بثلاث حالات (`nativeShieldState`): غير محفوظ ← «فعّل الحماية»؛ محفوظ وينتظر التأكيد ← خطوات عربية مرقّمة (`NATIVE_SHIELD_STEPS`)؛ مفعّل ← «أوقف الحماية». الحالة الفعلية تُفحص أيضًا عبر المضيف الكناري `shield-test.alhajda.com`. وإلا تثبيت ملف التعريف عبر Safari.

## ما يلزم للشحن
1. developer.apple.com › Identifiers › `com.alhajda.waha` › فعّل **Network Extensions** (الفريق HQRPK78BRV). لا رسوم إضافية ضمن عضوية المطوّر.
2. إعادة توليد ملف التوقيع App Store (Codemagic يجلبه تلقائيًا بتكامل App Store Connect بعد تفعيل القدرة).
3. البناء على Xcode 26 وتجربة على جهاز حقيقي (المحاكي لا يطبّق إعدادات DNS): enable → الإعدادات › عام › الشبكة الخاصة الافتراضية وإدارة الجهاز › DNS › اختر «درع واحة» → افتح درع الإعلانات في واحة ويجب أن يظهر «✅ مفعّل».
4. مراجعة App Store: وصف الميزة في App Review Notes (تطبيق يضبط DNS مشفّر لحجب الإعلانات، بلا سجلات)، وتحديث ملصق الخصوصية: لا جمع بيانات.
5. دمج الفرع في `main` (يشغّل TestFlight) — بعد موافقة إلياس فقط.

## حدود صادقة
- iOS لا يسمح لأي تطبيق بتفعيل DNS بصمت: بعد الضغط يلزم اختيار «درع واحة» مرة واحدة من الإعدادات.
- البناء يتم على Codemagic (لا Xcode في بيئة Hark).
- الخطر الأكبر قبل الإطلاق العام: طبقة Workers المجانية (~100 ألف طلب/يوم ≈ 10–30 جوالًا)؛ فوق الحد يفشل DNS للجميع حتى إعادة الضبط.
- إذا كان ملف تعريف `درع الهجدة` مثبتًا أيضًا، يتعارض الإعدادان؛ اترك واحدًا.
