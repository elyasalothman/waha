# واحة للكمبيوتر · Waha Desktop

> مؤقتًا يعيش هذا المشروع في الفرع اليتيم `desktop/waha-desktop` داخل `elyasalothman/waha` (لا يشارك main أي تاريخ). عند إنشاء المستودع المستقل `elyasalothman/waha-desktop`: `git push <new-remote> desktop/waha-desktop:main` وسيصبح وسم الإصدار `v0.2.0` تلقائيًا بدل `desktop-v0.2.0`.

تطبيق سطح مكتب خفيف (Tauri 2) لويندوز وماك يضم أداتين من «بدائل مجانية لبرامج مدفوعة» في [متجر واحة](https://waha.hajdah.com/store):

- **استوديو PDF** — دمج ملفات PDF والصور، ترتيب الصفحات وتدويرها وحذفها، استخراج صفحات، توقيع، ختم نصي، أرقام صفحات.
- **منشئ السيرة الذاتية** — عربي/إنجليزي، ثلاثة قوالب، حفظ تلقائي على الجهاز، تصدير PDF عبر نافذة الطباعة، نسخة احتياطية JSON.

الأدوات الأساسية تعمل دون إنترنت: خطوط IBM Plex Sans Arabic وAmiri وملفات pdf.js مضمّنة، الأدوات الأساسية لا تحتاج شبكة. محسن يمكنه الاتصال بخادم محلي أو خدمات اختيارية عند الطلب. الفتح والحفظ عبر نوافذ النظام الأصلية (`@tauri-apps/plugin-dialog` + `plugin-fs`) بدل تنزيلات المتصفح.

## التطوير

```bash
npm ci            # ينسخ أيضًا ملفات pdf.js إلى public/pdfjs
npm test          # النواة المشتركة والمضيف وأدوات الملفات
npm run build     # بناء الواجهة إلى dist/
npm run tauri dev # يتطلب Rust وتبعيات Tauri للنظام
npm run tauri build
```

## من أين جاء الكود

الأدوات منسوخة من مستودع `elyasalothman/waha` (commit `2acca0f`)، دون تعديل واحة:

| هنا | في واحة |
|---|---|
| `src/tools/pdf-studio.tsx`, `cv-builder.tsx`, `signature-pad.tsx`, `shell.tsx` | `src/apps/pro/*` |
| `src/lib/cv.ts`, `pixels.ts`, `pdf-geometry.ts`, `files.ts`, `pro.test.ts` | `src/lib/pro/*` |
| `src/lib/pdf-client.ts` | `src/lib/books/private/pdf-client.ts` |

التعديلات الخاصة بسطح المكتب: `src/lib/native.ts` (نوافذ فتح/حفظ أصلية وتأكيد أصلي)، `saveBlob` يستخدم «حفظ باسم» في Tauri، زر العودة يذهب للرئيسية بدل `/store`، وإخفاء زر «مشاركة». عند تحديث الأدوات في واحة انسخ الملفات ثم أعد تطبيق هذه التعديلات (ابحث عن `isTauri`).

## البناء والإصدارات

`.github/workflows/build-installers` يبني على كل دفع إلى `desktop/waha-desktop` (أو `main` في المستودع المستقل): ويندوز (`.msi` و`.exe` NSIS)، ماك (`.dmg` Universal)، ولينكس (`.deb`/`.AppImage`)، ويرفعها كـ artifacts وفي مسودة إصدار `v0.2.0`. الحزم **غير موقّعة**: ويندوز SmartScreen وماك Gatekeeper سيحذّران. انظر `docs/STORE-PUBLISHING.md`.

الأيقونة من شعار الحجدة (الهلال والكثبان)، المصدر `assets/icon-source.png`، وتُولَّد الأحجام بـ `npm run icons`.


## محسن 0.2.0

الرئيسية تبدأ بشريط «اسأل محسن أو اطلب منه» (Ctrl+K)، مع لوحة RTL تتبع مظهر النظام. الحساب والحل الرياضي والتحويلات والملاحظات والذاكرة والتذكيرات تعمل محليًا. يدعم اكتشاف Ollama وllama.cpp/LM Studio واختيار نموذج، وثلاثة أوضاع: محلي فقط، محلي ثم سحابة (الافتراضي)، سحابة. لا تنزيل تلقائي ولا مفاتيح.

النواة في `src/lib/agent/` من واحة عند SHA `6bea8d86f53d8dd7ac0beb073441f14ff8881e4c`، نُقلت بواسطة `scripts/export-agent-core.mjs` مع اعتمادياتها دون محلل ثانٍ. اختبارات النواة وcorpus التقييم من المصدر نفسه. ينفّذ المضيف أدوات سطح المكتب فقط، ويتحقق من مخطط JSON الذي يعيده النموذج ويطلب التأكيد قبل التغيير أو الفتح الخارجي. البيانات في `appDataDir/mohsen.json`، ومعاينة الويب تستخدم localStorage.

راجع [دليل محسن المحلي](docs/LOCAL-MOHSEN.md) للتثبيت والخصوصية وجدول الأدوات والحدود. فحص الواجهة: `npm run audit:agent` بعد البناء (يشغّل vite preview محليًا)، والتقرير [docs/audits/desktop-agent.json](docs/audits/desktop-agent.json). لا نشر للإصدار: CI يرفق المثبتات بمسودة فقط.
