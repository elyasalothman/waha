# واحة · Waha

واحة رقمية يومية بالعربية أولاً: **أفراد** لصلاتك وأوراقك ومالك، و**عمل** لعملاء وفواتير وساعات المنشأة. كل شيء يُحفظ على الجهاز، بلا حساب.

## الوضعان

- **أفراد** — مواقيت أم القرى، أذكار، وثائق، فواتير المنزل، زكاة، ذهب، ألعاب
- **عمل** — عملاء، عروض سعر، فاتورة برمز هيئة الزكاة (TLV)، رخص المنشأة، رواتب بعد التأمينات، بوابات قوى والزكاة

التبديل من المفتاح أعلى القائمة. العربية افتراضياً، مع إنجليزي بنقرة.

## التشغيل

```bash
npm install
npm run dev
```

يفتح على `http://localhost:8080`. للبناء:

```bash
npm run typecheck
npm run build
```

## آيفون

قشرة Capacitor (`com.alhajda.waha`) تُبنى على Codemagic وتُرفع لـ TestFlight — بلا ماك. التفاصيل: [docs/IOS.md](docs/IOS.md) و[docs/TESTFLIGHT.md](docs/TESTFLIGHT.md).

## أندرويد

نفس الحزمة `com.alhajda.waha` في `android/`. `versionName` يطابق تسويق iOS **1.2.1**، و`versionCode` يبدأ من **1** لأن Play لم يستلم AAB بعد. لا تُشغَّل رحلة Codemagic للأندرويد.

بناء محلي بلا Codemagic (JDK 21 وAndroid SDK على الجهاز):

```bash
npm ci
npm run cap:sync:android
cd android && ./gradlew assembleDebug
```

الناتج `android/app/build/outputs/apk/debug/app-debug.apk` موقّع بمفتاح debug المحلي فقط. حزمة إصدار غير موقّعة (Play يرفضها): `./gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`.

لرفع Play يبقى مطلوباً مفتاح رفع خارج Git: ملف `.jks` أو `.keystore`، و`storePassword`، و`keyAlias`، و`keyPassword` في `android/keystore.properties` (مسار `storeFile` نسبة إلى `android/`). لا يُنشأ المفتاح هنا ولا يُدفَع.

## ترخيص

خاص بصاحب المستودع.
