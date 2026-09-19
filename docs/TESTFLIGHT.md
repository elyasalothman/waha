# واحة — TestFlight بلا ماك

إلياس يبني على **Codemagic** (ماك سحابي)، نفس بيت تهجد وحصتي. لا تحتاج ماك بوك بعد النقرات أدناه.

## ما هو جاهز في المستودع

| ملف | الغرض |
|---|---|
| `codemagic.yaml` | رحلة `ios-release` → أرشفة `com.alhajda.waha` → TestFlight |
| `.github/workflows/trigger-codemagic-ios.yml` | زر GitHub يشغّل الرحلة على `main` |
| `ios/App` | مشروع Xcode + Podfile (يُزامَن على الماك السحابي) |
| `scripts/ios-agvtool.sh` / `ios-next-build.sh` | رقم البناء لا ينخفض أبداً |

## ما يجب أن ينقره إلياس في Apple (مرة واحدة)

حساب المطوّر موجود (فريق `HQRPK78BRV`). النقرات الجديدة لواحة فقط:

### 1) المعرّف — developer.apple.com

1. [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) → **Identifiers** → **+**
2. **App IDs** → App
3. Description: `Waha` / `واحة`
4. Bundle ID **Explicit**: `com.alhajda.waha`
5. Capabilities: اترك الافتراضي (لا Push / لا Associated Domains في هذه القشرة)
6. Register

لا تعِد استخدام `com.alhajda.tahajjud` أو `com.alhajda.hissati` أو `com.alhajda.mohsen`.

### 2) التطبيق — appstoreconnect.apple.com

1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** → New App
2. Platforms: **iOS**
3. Name: **واحة** (إن كان محجوزاً: **واحة — Waha**)
4. Primary Language: **Arabic**
5. Bundle ID: `com.alhajda.waha`
6. SKU: `waha`
7. User Access: Full Access

Privacy Policy URL عند الجاهزية: `https://alhajda.com/privacy`

### 3) مفتاح API (إن لم يكن مربوطاً بـ Codemagic)

إن كان مفتاح تهجد/حصتي مربوطاً بتكامل Codemagic اسمه `codemagic`، **لا تنشئ مفتاحاً جديداً** — أضِف تطبيق واحة لنفس التكامل.

وإلا:

1. App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API**
2. **+** Generate API Key — دور **App Manager**
3. نزّل `.p8` مرة واحدة. احفظ:
   - Key ID
   - Issuer ID
   - ملف `.p8`

### 4) Codemagic — codemagic.io

1. سجّل بحساب GitHub → **Add application** → `elyasalothman/waha`
2. Integrations → App Store Connect → نفس تكامل `codemagic`
3. Code signing identities → iOS → فعّل التوزيع لـ `com.alhajda.waha` (Codemagic ينشئ الملف إن مُنح الوصول)
4. انسخ **Application ID** من إعدادات التطبيق

### 5) أسرار GitHub (للزر فقط)

في `elyasalothman/waha` → Settings → Secrets:

- `CODEMAGIC_API_TOKEN` — Codemagic → Account settings → API
- `CODEMAGIC_APP_ID` — Application ID من الخطوة 4

ثم **Actions** → **Trigger Codemagic ios-release** → Run workflow.

أو من واجهة Codemagic: شغّل workflow `ios-release` على `main` (أو فرع هذا الـ PR للتجربة).

### 6) TestFlight

بعد أول أرشفة ناجحة:

1. App Store Connect → واحة → **TestFlight**
2. انتظر معالجة البناء (دقائق)
3. Internal Testing → أضِف نفسك / المجموعة
4. على الآيفون: تطبيق TestFlight → واحة → تثبيت

**لا Submit for Review** حتى يُختبر حقل عربي على جهاز آيفون (لوحة RTL، المؤشر من اليمين، الكيبورد لا يغطي الحقل مع `Keyboard.resize: native`). TestFlight الداخلي يكفي قبل ذلك. Codemagic لا يرسل المتجر (`submit_to_app_store` غير مفعّل).

## متغيرات اختيارية على Codemagic

| المتغير | المعنى |
|---|---|
| `WAHA_IOS_SERVER_URL` | إن وُضع قبل `cap sync`، WebView يفتح الإنتاج/المعاينة بدل `www/` |
| `PROJECT_BUILD_NUMBER` | أرضية رقم البناء إن لزم |

بدون `WAHA_IOS_SERVER_URL` تُحزَم `www/` (بناء العميل أو شاشة الواحة الاحتياطية).

## إن فشل التوقيع

- تأكد أن Bundle ID `com.alhajda.waha` موجود في البوابة
- تكامل ASC في Codemagic يرى التطبيق الجديد
- الفريق `HQRPK78BRV` هو نفس تهجد

لا تشغّل `npx cap sync ios` على ويندوز ثم تدفع `ios/` — المسارات تتكسر. عدّل `ios/` في Git هنا أو على ماك Codemagic فقط.
