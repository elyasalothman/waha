import { asmaOfDay } from "@/lib/asma";
import { proverbOfDay } from "@/lib/proverbs";

export type Ayah = { ar: string; en: string; refAr: string; refEn: string };

export const AYAHS: Ayah[] = [
  { ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", en: "You alone we worship, and You alone we ask for help.", refAr: "الفاتحة ١:٥", refEn: "Al-Fatihah 1:5" },
  { ar: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ", en: "Remember Me; I will remember you. Be grateful to Me and do not deny Me.", refAr: "البقرة ٢:١٥٢", refEn: "Al-Baqarah 2:152" },
  { ar: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", en: "When My servants ask you about Me, I am near.", refAr: "البقرة ٢:١٨٦", refEn: "Al-Baqarah 2:186" },
  { ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", en: "God does not burden a soul beyond its capacity.", refAr: "البقرة ٢:٢٨٦", refEn: "Al-Baqarah 2:286" },
  { ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", en: "Surely in the remembrance of God do hearts find rest.", refAr: "الرعد ١٣:٢٨", refEn: "Ar-Ra’d 13:28" },
  { ar: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", en: "If you are grateful, I will surely increase you.", refAr: "إبراهيم ١٤:٧", refEn: "Ibrahim 14:7" },
  { ar: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ", en: "God commands justice and excellence.", refAr: "النحل ١٦:٩٠", refEn: "An-Nahl 16:90" },
  { ar: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا", en: "Your Lord has decreed that you worship none but Him, and that you be kind to parents.", refAr: "الإسراء ١٧:٢٣", refEn: "Al-Isra 17:23" },
  { ar: "رَبِّ اشْرَحْ لِي صَدْرِي", en: "My Lord, expand for me my breast.", refAr: "طه ٢٠:٢٥", refEn: "Ta-Ha 20:25" },
  { ar: "لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ", en: "There is no god but You; glory be to You. I have been of the wrongdoers.", refAr: "الأنبياء ٢١:٨٧", refEn: "Al-Anbiya 21:87" },
  { ar: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ", en: "Our Lord, grant us from our spouses and children comfort of the eyes.", refAr: "الفرقان ٢٥:٧٤", refEn: "Al-Furqan 25:74" },
  { ar: "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ", en: "My Lord, I am in need of whatever good You send down to me.", refAr: "القصص ٢٨:٢٤", refEn: "Al-Qasas 28:24" },
  { ar: "وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا", en: "Those who strive for Us — We will surely guide them to Our ways.", refAr: "العنكبوت ٢٩:٦٩", refEn: "Al-Ankabut 29:69" },
  { ar: "وَوَصَّيْنَا الْإِنسَانَ بِوَالِدَيْهِ", en: "We have commanded the human being concerning parents.", refAr: "لقمان ٣١:١٤", refEn: "Luqman 31:14" },
  { ar: "إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ", en: "God and His angels send blessings upon the Prophet.", refAr: "الأحزاب ٣٣:٥٦", refEn: "Al-Ahzab 33:56" },
  { ar: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", en: "Say: O My servants who have transgressed against themselves, do not despair of the mercy of God.", refAr: "الزمر ٣٩:٥٣", refEn: "Az-Zumar 39:53" },
  { ar: "إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ", en: "The most honoured of you with God is the most mindful.", refAr: "الحجرات ٤٩:١٣", refEn: "Al-Hujurat 49:13" },
  { ar: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ", en: "I did not create jinn and humankind except to worship Me.", refAr: "الذاريات ٥١:٥٦", refEn: "Adh-Dhariyat 51:56" },
  { ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", en: "Whoever relies upon God — He is sufficient for him.", refAr: "الطلاق ٦٥:٣", refEn: "At-Talaq 65:3" },
  { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "Truly with hardship comes ease.", refAr: "الشرح ٩٤:٥", refEn: "Ash-Sharh 94:5" },
  { ar: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ", en: "Read in the name of your Lord who created.", refAr: "العلق ٩٦:١", refEn: "Al-Alaq 96:1" },
  { ar: "قُلْ هُوَ اللَّهُ أَحَدٌ", en: "Say: He is God, the One.", refAr: "الإخلاص ١١٢:١", refEn: "Al-Ikhlas 112:1" },
  { ar: "وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ", en: "Rely upon the Living who does not die.", refAr: "الفرقان ٢٥:٥٨", refEn: "Al-Furqan 25:58" },
  { ar: "وَأْمُرْ أَهْلَكَ بِالصَّلَاةِ وَاصْطَبِرْ عَلَيْهَا", en: "Enjoin prayer upon your family and be steadfast in it.", refAr: "طه ٢٠:١٣٢", refEn: "Ta-Ha 20:132" },
  { ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", en: "Our Lord, give us good in this world and good in the next.", refAr: "البقرة ٢:٢٠١", refEn: "Al-Baqarah 2:201" },
  { ar: "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ", en: "Perhaps you dislike a thing and it is good for you.", refAr: "البقرة ٢:٢١٦", refEn: "Al-Baqarah 2:216" },
  { ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "Indeed, with hardship comes ease.", refAr: "الشرح ٩٤:٦", refEn: "Ash-Sharh 94:6" },
  { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا", en: "And say: My Lord, increase me in knowledge.", refAr: "طه ٢٠:١١٤", refEn: "Ta-Ha 20:114" },
];

export function ayahOfDay(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0).getTime();
  const day = Math.floor((d.getTime() - start) / 86400000);
  return AYAHS[day % AYAHS.length]!;
}

export function dailyBundle(d = new Date()) {
  return { ayah: ayahOfDay(d), asma: asmaOfDay(d), proverb: proverbOfDay(d) };
}
