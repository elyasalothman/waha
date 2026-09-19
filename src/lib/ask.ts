import { getTimes, nextPrayer, prayerLabel, formatHm, qiblaDeg, formatDuration } from "@/lib/prayer";
import { weatherLabel, type WeatherPayload } from "@/lib/weather";
import { copy, loc, type Lang } from "@/lib/locale";
import type { City } from "@/lib/cities";

export type Honesty = "supported" | "partial" | "unknown";

export type AskAnswer = {
  text: string;
  honesty: Honesty;
  follow?: string[];
};

const UNKNOWN_HINT = [
  /طبيب|مرض|دواء|تشخيص|سرطان|قلب|ضغط|سكر|legal|lawsuit|محامي|فتوى|طلاق|ميراث قض|استثمر كل|قرض ربوي|medical|diagnos|lawsuit|attorney/i,
];

function cityName(city: City, lang: Lang) {
  return lang === "ar" ? city.ar : city.en;
}

export function answerLocally(
  q: string,
  ctx: { city: City; lang: Lang; now: Date; weather: WeatherPayload | null },
): AskAnswer | null {
  const text = q.trim();
  if (!text) return null;
  const { city, lang, now, weather } = ctx;
  const tz = city.tz || "Asia/Riyadh";
  const pt = getTimes(city.lat, city.lon, now, tz);
  const next = nextPrayer(pt, now, tz);
  const qibla = Math.round(qiblaDeg(city.lat, city.lon));
  const name = cityName(city, lang);

  if (UNKNOWN_HINT.some((re) => re.test(text))) {
    return {
      honesty: "unknown",
      text: loc(
        lang,
        copy(
          "لا أعرف — هذا طب أو قانون أو مال حسّاس. واحة لا تفتي ولا تشخّص. اسأل مختصاً.",
          "I don’t know — this is medicine, law, or sensitive money. Waha does not issue rulings or diagnoses. Ask a specialist.",
          "不知——这是医疗、法律或敏感金钱。请询问专业人士。",
          "No sé — es medicina, derecho o dinero sensible. Consulta a un especialista.",
          "Je ne sais pas — médecine, droit ou argent sensible. Demande à un spécialiste.",
          "मुझे नहीं पता — यह चिकित्सा, कानून या संवेदनशील धन है। विशेषज्ञ से पूछें।",
        ),
      ),
    };
  }

  const prayerish = /صلاة|الصلاة|فجر|ظهر|عصر|مغرب|عشاء|prayer|fajr|dhuhr|asr|maghrib|isha|namaz|salah|礼拜|oración|prière|नमाज़/i.test(
    text,
  );
  const nextish = /التالي|القادم|بعدين|next|soon|下次|siguiente|prochaine|अगली/i.test(text);
  const weatherish = /طقس|جو|حرار|برد|مطر|weather|temp|hot|cold|天气|clima|météo|मौसम/i.test(text);
  const qiblaish = /قبل|qibla|mecca|مكة|朝向|alquibla|qibla|किबला/i.test(text);
  const todayish = /يومك|اليوم|today|今天|hoy|aujourd|आज/i.test(text);

  if (prayerish || nextish) {
    return {
      honesty: "supported",
      text: loc(
        lang,
        copy(
          `التالي ${prayerLabel(next.key, lang)} ${formatHm(next.at, lang, tz)} في ${name} — بعد ${formatDuration(next.at.getTime() - now.getTime(), lang)}. طريقة أم القرى.`,
          `Next is ${prayerLabel(next.key, lang)} at ${formatHm(next.at, lang, tz)} in ${name} — in ${formatDuration(next.at.getTime() - now.getTime(), lang)}. Umm al-Qura.`,
          `下一次是${prayerLabel(next.key, lang)} ${formatHm(next.at, lang, tz)}（${name}），还有 ${formatDuration(next.at.getTime() - now.getTime(), lang)}。乌姆库拉。`,
          `Siguiente: ${prayerLabel(next.key, lang)} a las ${formatHm(next.at, lang, tz)} en ${name} — en ${formatDuration(next.at.getTime() - now.getTime(), lang)}. Umm al-Qura.`,
          `Prochaine : ${prayerLabel(next.key, lang)} à ${formatHm(next.at, lang, tz)} à ${name} — dans ${formatDuration(next.at.getTime() - now.getTime(), lang)}. Oumm al-Qura.`,
          `अगली ${prayerLabel(next.key, lang)} ${formatHm(next.at, lang, tz)} ${name} में — ${formatDuration(next.at.getTime() - now.getTime(), lang)} में। उम्म अल-क़ुरा।`,
        ),
      ),
      follow: [
        loc(lang, copy("القبلة؟", "Qibla?", "朝向？", "¿Qibla?", "Qibla ?", "क़िबला?")),
        loc(lang, copy("كيف الجو؟", "How is the weather?", "天气如何？", "¿El tiempo?", "La météo ?", "मौसम कैसा?")),
      ],
    };
  }

  if (qiblaish) {
    return {
      honesty: "supported",
      text: loc(
        lang,
        copy(
          `القبلة من ${name} تقريباً ${qibla}°.`,
          `Qibla from ${name} is about ${qibla}°.`,
          `${name} 的朝向约 ${qibla}°。`,
          `La qibla desde ${name} es unos ${qibla}°.`,
          `La qibla depuis ${name} est d’environ ${qibla}°.`,
          `${name} से क़िबला लगभग ${qibla}° है।`,
        ),
      ),
    };
  }

  if (weatherish && weather) {
    const deg = Math.round(weather.current.temperature);
    return {
      honesty: "supported",
      text: loc(
        lang,
        copy(
          `الجو في ${name} ${deg}° — ${weatherLabel(weather.current.code, lang)}.`,
          `Weather in ${name}: ${deg}° — ${weatherLabel(weather.current.code, lang)}.`,
          `${name} 天气 ${deg}° — ${weatherLabel(weather.current.code, lang)}。`,
          `Tiempo en ${name}: ${deg}° — ${weatherLabel(weather.current.code, lang)}.`,
          `Météo à ${name} : ${deg}° — ${weatherLabel(weather.current.code, lang)}.`,
          `${name} में मौसम ${deg}° — ${weatherLabel(weather.current.code, lang)}.`,
        ),
      ),
    };
  }

  if (todayish) {
    const deg = weather ? `${Math.round(weather.current.temperature)}°` : "";
    return {
      honesty: "supported",
      text: loc(
        lang,
        copy(
          `يومك في ${name}: التالي ${prayerLabel(next.key, lang)} ${formatHm(next.at, lang, tz)}${deg ? `، الجو ${deg}` : ""}.`,
          `Your day in ${name}: next ${prayerLabel(next.key, lang)} ${formatHm(next.at, lang, tz)}${deg ? `, ${deg}` : ""}.`,
          `${name} 的今天：下一次 ${prayerLabel(next.key, lang)} ${formatHm(next.at, lang, tz)}${deg ? `，${deg}` : ""}。`,
          `Tu día en ${name}: ${prayerLabel(next.key, lang)} ${formatHm(next.at, lang, tz)}${deg ? `, ${deg}` : ""}.`,
          `Ton jour à ${name} : ${prayerLabel(next.key, lang)} ${formatHm(next.at, lang, tz)}${deg ? `, ${deg}` : ""}.`,
          `${name} में आज: अगली ${prayerLabel(next.key, lang)} ${formatHm(next.at, lang, tz)}${deg ? `, ${deg}` : ""}.`,
        ),
      ),
    };
  }

  return null;
}

export function honestyLabel(lang: Lang, h: Honesty) {
  if (h === "supported") return loc(lang, copy("مدعوم", "Supported", "有据", "Sustentado", "Étayé", "समर्थित"));
  if (h === "partial") return loc(lang, copy("جزئي", "Partial", "部分", "Parcial", "Partiel", "आंशिक"));
  return loc(lang, copy("لا أعرف", "I don’t know", "不知", "No sé", "Je ne sais pas", "मुझे नहीं पता"));
}
