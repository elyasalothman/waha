export type Dua = { id: string; ar: string; en: string; textAr: string; textEn: string };

export type DuaGroup = { id: string; ar: string; en: string; items: Dua[] };

export const DUA_GROUPS: DuaGroup[] = [
  {
    id: "sleep",
    ar: "النوم",
    en: "Sleep",
    items: [
      { id: "sleep-1", ar: "عند النوم", en: "At bedtime", textAr: "باسمك اللهم أموت وأحيا", textEn: "In Your name, O God, I die and I live." },
      { id: "sleep-2", ar: "آية الكرسي", en: "Ayat al-Kursi", textAr: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ", textEn: "God — there is no god but He, the Ever-Living, the Self-Subsisting. Neither slumber nor sleep overtakes Him." },
      { id: "sleep-3", ar: "المعوذات", en: "The protecting surahs", textAr: "اقرأ الإخلاص والفلق والناس ثلاثاً، وامسح ما استطعت من جسدك.", textEn: "Recite Al-Ikhlas, Al-Falaq, and An-Nas three times, and wipe over what you can of your body." },
      { id: "sleep-4", ar: "الاستيقاظ", en: "On waking", textAr: "الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور", textEn: "Praise be to God who gave us life after causing us to die, and to Him is the resurrection." },
    ],
  },
  {
    id: "travel",
    ar: "السفر",
    en: "Travel",
    items: [
      { id: "tr-1", ar: "دعاء السفر", en: "Travel prayer", textAr: "سبحان الذي سخّر لنا هذا وما كنا له مقرنين، وإنا إلى ربنا لمنقلبون", textEn: "Glory to Him who has subjected this to us, and we could not have done it by ourselves. And to our Lord we will surely return." },
      { id: "tr-2", ar: "دخول البلد", en: "Entering a town", textAr: "اللهم رب السموات السبع وما أظللن، ورب الأرضين السبع وما أقللن، ورب الشياطين وما أضللن، ورب الرياح وما ذرين، أسألك خير هذه القرية وخير أهلها، وأعوذ بك من شرها وشر أهلها وشر ما فيها", textEn: "O God, Lord of the seven heavens and what they shade… I ask You for the good of this town and its people, and I seek refuge from its evil." },
      { id: "tr-3", ar: "الرجوع", en: "Returning", textAr: "آيبون تائبون عابدون لربنا حامدون", textEn: "We return, we repent, we worship, and we praise our Lord." },
    ],
  },
  {
    id: "food",
    ar: "الطعام",
    en: "Food",
    items: [
      { id: "f-1", ar: "قبل الأكل", en: "Before eating", textAr: "بسم الله", textEn: "In the name of God." },
      { id: "f-2", ar: "نسيان التسمية", en: "If you forget", textAr: "بسم الله أوله وآخره", textEn: "In the name of God, at its beginning and its end." },
      { id: "f-3", ar: "بعد الأكل", en: "After eating", textAr: "الحمد لله الذي أطعمنا وسقانا وجعلنا مسلمين", textEn: "Praise be to God who fed us and gave us drink and made us Muslims." },
    ],
  },
  {
    id: "salah",
    ar: "بعد الصلاة",
    en: "After prayer",
    items: [
      { id: "s-1", ar: "الاستغفار", en: "Istighfar", textAr: "أستغفر الله، أستغفر الله، أستغفر الله. اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام", textEn: "I seek God’s forgiveness (three times). O God, You are Peace and from You is peace. Blessed are You, O Lord of Majesty and Honour." },
      { id: "s-2", ar: "آية الكرسي", en: "Ayat al-Kursi", textAr: "قراءة آية الكرسي دبر كل صلاة مكتوبة.", textEn: "Recite Ayat al-Kursi after every obligatory prayer." },
      { id: "s-3", ar: "التسبيح", en: "Tasbih", textAr: "سبحان الله ٣٣، الحمد لله ٣٣، الله أكبر ٣٣، ثم لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.", textEn: "Subhan Allah 33, Alhamdulillah 33, Allahu akbar 33, then the tahlil." },
    ],
  },
  {
    id: "ruqyah",
    ar: "الرقية",
    en: "Ruqyah",
    items: [
      { id: "r-1", ar: "الفاتحة", en: "Al-Fatihah", textAr: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ …", textEn: "In the name of God, the Most Merciful, the Especially Merciful. Praise be to God, Lord of the worlds…" },
      { id: "r-2", ar: "المعوذتان", en: "Al-Falaq & An-Nas", textAr: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ … قُلْ أَعُوذُ بِرَبِّ النَّاسِ …", textEn: "Say: I seek refuge with the Lord of daybreak… Say: I seek refuge with the Lord of people…" },
      { id: "r-3", ar: "رقية الألم", en: "For pain", textAr: "ضع يدك على الذي تألّم من جسدك وقل: بسم الله (ثلاثاً)، أعوذ بعزة الله وقدرته من شر ما أجد وأحاذر (سبعاً).", textEn: "Place your hand on the pain and say: In the name of God (three times). I seek refuge in God’s might and power from what I feel and fear (seven times)." },
    ],
  },
  {
    id: "home",
    ar: "البيت",
    en: "Home",
    items: [
      { id: "h-1", ar: "دخول المنزل", en: "Entering the home", textAr: "بسم الله ولجنا، وبسم الله خرجنا، وعلى ربنا توكلنا", textEn: "In the name of God we enter, in the name of God we leave, and upon our Lord we rely." },
      { id: "h-2", ar: "الخروج", en: "Leaving", textAr: "بسم الله، توكلت على الله، ولا حول ولا قوة إلا بالله", textEn: "In the name of God, I rely upon God, and there is no power except with God." },
      { id: "h-3", ar: "دخول الخلاء", en: "Entering the washroom", textAr: "اللهم إني أعوذ بك من الخبث والخبائث", textEn: "O God, I seek refuge in You from the male and female unclean spirits." },
    ],
  },
];
