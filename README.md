# واحة · Waha

سوبر-أب عربي للحياة اليومية. **ظل اليوم** يمتلئ فوراً: الساعة، طقس الرياض (Open-Meteo)، والصلاة التالية حسب **أم القرى**. ثم الآبار، اسأل واحة، وألعاب البيت — بلا خانات فارغة.

## التجربة

- **ظل اليوم** — الآن + الصلاة التالية + الطقس، بأرقام لاتينية واضحة (لا تبتلعها الخطوط العربية)
- **شرائح** — للكل / طفل / طالب / أسرة / عمل / كبير السن / مسافر
- **6 لغات** — العربية، English، 中文، Español، Français، हिन्दी
- **اسأل واحة** — وسم صدق: مدعوم / جزئي / لا أعرف
- **أبواب الهجدة** (روابط، بلا استنساخ خوادم):
  - [تهجد](https://tahajjud.alhajda.com)
  - [محسن](https://ai.alhajda.com)
  - [لُمعة](https://games.alhajda.com)
  - [البيت](https://alhajda.com)
- **مختبر** لميزات تجريبية، و**إدارة** برقم سري محلي
- **PWA** جاهز لغلاف Capacitor على iOS (manifest + أيقونات + safe areas)

ما بقي من الريب: كتالوج الأفراد/العمل (صلاة، زكاة، فاتورة هيئة الزكاة، بلوت، مهام…) يُحفظ على الجهاز.

## التشغيل

```bash
npm install
npm run dev
```

يفتح على `http://localhost:8080`.

```bash
npm run typecheck
npm run build
```

معاينة عامة اليوم: [waha-preview-elyasalothman-3228.vercel.app](https://waha-preview-elyasalothman-3228.vercel.app)

الاستضافة المفضّلة بعد ربط الإنتاج: Vercel على `waha.alhajda.com` أو مشروع `waha`. لا تترك المعاينة على grok-sandbox فقط.

## التقنية

TanStack Start وReact 19 وTailwind v4. المواقيت: `adhan` أم القرى. الطقس: Open-Meteo. البيانات الشخصية في `localStorage`.

## ترخيص

خاص بصاحب المستودع.
