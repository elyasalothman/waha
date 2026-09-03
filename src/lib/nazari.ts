export type NazariQ = {
  id: string;
  ar: string;
  en: string;
  options: { ar: string; en: string }[];
  answer: number;
};

export const NAZARI: NazariQ[] = [
  {
    id: "speed-city",
    ar: "الحد الأقصى المعتاد داخل الأحياء السكنية غالباً هو:",
    en: "The usual speed limit inside residential areas is:",
    options: [
      { ar: "٤٠ كم/س", en: "40 km/h" },
      { ar: "٥٠–٨٠ كم/س حسب اللوحة", en: "50–80 km/h as posted" },
      { ar: "١٢٠ كم/س", en: "120 km/h" },
      { ar: "بلا حد", en: "No limit" },
    ],
    answer: 1,
  },
  {
    id: "highway",
    ar: "الحد الأقصى على كثير من الطرق السريعة في المملكة:",
    en: "The limit on many Saudi highways is:",
    options: [
      { ar: "٨٠ كم/س", en: "80 km/h" },
      { ar: "١٠٠ كم/س", en: "100 km/h" },
      { ar: "١٢٠ كم/س", en: "120 km/h" },
      { ar: "١٤٠ كم/س", en: "140 km/h" },
    ],
    answer: 2,
  },
  {
    id: "belt",
    ar: "حزام الأمان:",
    en: "Seatbelts:",
    options: [
      { ar: "اختياري في المقعد الخلفي", en: "Optional in the back" },
      { ar: "إلزامي للسائق والركاب", en: "Required for driver and passengers" },
      { ar: "للرحلات الطويلة فقط", en: "Only on long trips" },
      { ar: "للنساء فقط", en: "Only for women" },
    ],
    answer: 1,
  },
  {
    id: "phone",
    ar: "استخدام الجوال باليد أثناء القيادة:",
    en: "Holding a phone while driving:",
    options: [
      { ar: "مسموح تحت ٨٠ كم/س", en: "Allowed under 80 km/h" },
      { ar: "مخالفة", en: "An offence" },
      { ar: "مسموح عند الإشارة الحمراء فقط", en: "Allowed at a red light" },
      { ar: "مسموح للمكالمات الرسمية", en: "Allowed for official calls" },
    ],
    answer: 1,
  },
  {
    id: "yellow",
    ar: "الإشارة الصفراء تعني:",
    en: "A yellow light means:",
    options: [
      { ar: "سرّع قبل أن تحمر", en: "Speed up before it turns red" },
      { ar: "قف إن أمكن ذلك بأمان", en: "Stop if you can do so safely" },
      { ar: "تجاهلها إن كان الطريق فارغاً", en: "Ignore it if the road is empty" },
      { ar: "مثل الخضراء", en: "Same as green" },
    ],
    answer: 1,
  },
  {
    id: "roundabout",
    ar: "أولوية المرور في الدوار عادةً لـ:",
    en: "Right of way at a roundabout usually belongs to:",
    options: [
      { ar: "القادم من اليمين خارج الدوار", en: "Traffic arriving from the right" },
      { ar: "الموجود داخل الدوار", en: "Vehicles already in the roundabout" },
      { ar: "الأكبر حجماً", en: "The larger vehicle" },
      { ar: "من يطلق البوق أولاً", en: "Whoever honks first" },
    ],
    answer: 1,
  },
  {
    id: "alcohol",
    ar: "نسبة الكحول المسموحة للسائق في المملكة:",
    en: "The permitted blood-alcohol level for drivers in the Kingdom is:",
    options: [
      { ar: "٠٫٠٥٪", en: "0.05%" },
      { ar: "صفر", en: "Zero" },
      { ar: "حسب وزن السائق", en: "Depends on body weight" },
      { ar: "مسموح ليلاً", en: "Allowed at night" },
    ],
    answer: 1,
  },
  {
    id: "child",
    ar: "الطفل في المقعد الأمامي:",
    en: "A child in the front seat:",
    options: [
      { ar: "مسموح دائماً", en: "Always allowed" },
      { ar: "يُفضَّل المقعد الخلفي ومقعد الطفل حسب العمر", en: "The back seat and a child seat by age are preferred" },
      { ar: "فقط فوق ثلاث سنوات", en: "Only over three years" },
      { ar: "إذا ربط الحزام يكفي", en: "A belt is enough" },
    ],
    answer: 1,
  },
  {
    id: "emergency",
    ar: "رقم الطوارئ الموحد في المملكة:",
    en: "The unified emergency number in the Kingdom is:",
    options: [
      { ar: "٩١١", en: "911" },
      { ar: "٩٩٩", en: "999" },
      { ar: "٩٩٧", en: "997" },
      { ar: "٩٢٠٠", en: "9200" },
    ],
    answer: 0,
  },
  {
    id: "stop",
    ar: "علامة قف تعني:",
    en: "A STOP sign means:",
    options: [
      { ar: "خفّف إن رأيت سيارة", en: "Slow if you see a car" },
      { ar: "قف تماماً ثم سر إن كان الطريق آمناً", en: "Come to a full stop, then go if clear" },
      { ar: "قف إن أحببت", en: "Stop if you like" },
      { ar: "للشاحنات فقط", en: "Trucks only" },
    ],
    answer: 1,
  },
  {
    id: "fog",
    ar: "في الضباب الكثيف:",
    en: "In heavy fog:",
    options: [
      { ar: "استخدم الضوء العالي", en: "Use high beams" },
      { ar: "خفّف السرعة واستخدم ضوء الضباب", en: "Slow down and use fog lights" },
      { ar: "ألصق السيارة التي أمامك", en: "Tailgate the car ahead" },
      { ar: "أوقف في منتصف الطريق", en: "Stop in the middle of the road" },
    ],
    answer: 1,
  },
  {
    id: "night",
    ar: "الضوء العالي يُخفَض عند:",
    en: "High beams should be dipped when:",
    options: [
      { ar: "وجود مركبة مقابلة أو أمامك", en: "An oncoming or leading vehicle is present" },
      { ar: "داخل المدينة فقط", en: "Only in the city" },
      { ar: "لا يُخفَض أبداً", en: "Never" },
      { ar: "عند المطر فقط", en: "Only in rain" },
    ],
    answer: 0,
  },
  {
    id: "distance",
    ar: "مسافة الأمان التقريبية في الجو الجاف:",
    en: "A rough safe following distance in dry weather is:",
    options: [
      { ar: "نصف ثانية", en: "Half a second" },
      { ar: "ثانيتان أو أكثر", en: "Two seconds or more" },
      { ar: "عشر ثوانٍ دائماً", en: "Always ten seconds" },
      { ar: "لا حاجة لمسافة", en: "No gap needed" },
    ],
    answer: 1,
  },
  {
    id: "school",
    ar: "عند منطقة مدارس:",
    en: "Near a school zone:",
    options: [
      { ar: "السرعة كالسريع", en: "Highway speed is fine" },
      { ar: "خفّف والتزم باللوحة", en: "Slow down and obey the posted sign" },
      { ar: "البوق يكفي", en: "Honking is enough" },
      { ar: "تجاهل إن لم ترَ أطفالاً", en: "Ignore it if you see no children" },
    ],
    answer: 1,
  },
  {
    id: "tire",
    ar: "ضغط الإطارات يُفحص:",
    en: "Tyre pressure should be checked:",
    options: [
      { ar: "وهي ساخنة بعد رحلة طويلة", en: "When hot after a long trip" },
      { ar: "وهي باردة وفق توصية المصنع", en: "When cold, to the maker’s spec" },
      { ar: "بالنظر فقط", en: "By eye only" },
      { ar: "مرة كل خمس سنوات", en: "Once every five years" },
    ],
    answer: 1,
  },
  {
    id: "pedestrian",
    ar: "عند ممر المشاة:",
    en: "At a pedestrian crossing:",
    options: [
      { ar: "للمشاة أولوية وأنت ملزم بالوقوف", en: "Pedestrians have priority — you must stop" },
      { ar: "البوق يمرّرهم", en: "Honk to send them across" },
      { ar: "إن ركض فأنت غير مسؤول", en: "If they run, you are not responsible" },
      { ar: "للسيارات دائماً", en: "Cars always have priority" },
    ],
    answer: 0,
  },
  {
    id: "overtake",
    ar: "التجاوز ممنوع:",
    en: "Overtaking is forbidden:",
    options: [
      { ar: "على الخط المتقطع", en: "On a dashed line" },
      { ar: "على الخط المتصل والمنحنيات والقرب من الإشارات", en: "On a solid line, on bends, and near signals" },
      { ar: "ليلاً فقط", en: "Only at night" },
      { ar: "للسيدات فقط", en: "Only for women" },
    ],
    answer: 1,
  },
  {
    id: "right",
    ar: "في تقاطع بلا إشارات ولا دوار، الأولوية غالباً:",
    en: "At an unsigned intersection, priority usually goes:",
    options: [
      { ar: "للقادم من اليسار", en: "To the left" },
      { ar: "للقادم من اليمين", en: "To the right" },
      { ar: "للأسرع", en: "To the faster car" },
      { ar: "لمن معه ركاب", en: "To whoever has passengers" },
    ],
    answer: 1,
  },
  {
    id: "rain",
    ar: "على طريق مبلل:",
    en: "On a wet road:",
    options: [
      { ar: "زد السرعة لتنتهي أسرع", en: "Speed up to finish sooner" },
      { ar: "خفّف وزد مسافة الأمان", en: "Slow down and increase following distance" },
      { ar: "أطفئ الأنوار", en: "Turn lights off" },
      { ar: "استخدم الفرملة فجأة دائماً", en: "Always brake suddenly" },
    ],
    answer: 1,
  },
  {
    id: "park",
    ar: "الوقوف ممنوع عادةً:",
    en: "Parking is usually forbidden:",
    options: [
      { ar: "أمام مواقف ذوي الإعاقة ومسارات الإطفاء والإسعاف", en: "In disabled bays and fire/ambulance lanes" },
      { ar: "في أي موقف أزرق", en: "In any blue bay" },
      { ar: "خلف المنزل فقط", en: "Only behind the house" },
      { ar: "يوم الجمعة", en: "On Fridays" },
    ],
    answer: 0,
  },
];
