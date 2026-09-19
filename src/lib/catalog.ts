import { doorExternalHref, getDoor, launcherDoors } from "@/lib/doors";
import { forSeriousHome, isPlayItem } from "@/lib/home-lock";

export type Audience = "personal" | "work";
export type Category = "life" | "money" | "tools" | "games" | "workspace" | "studio";
export type Lane =
  | "house"
  | "worship"
  | "civic"
  | "home"
  | "money"
  | "health"
  | "day"
  | "tools"
  | "play"
  | "desk"
  | "sales"
  | "team";

export type CatalogItem = {
  id: string;
  category: Category;
  lane: Lane;
  audience: Audience[];
  featured?: boolean;
  fresh?: boolean;
  /** بوابة تُفتح من اللانشر/المتجر، لا تُكدَّس على الرئيسية. */
  portal?: boolean;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
  icon: string;
  /** Same-tab door to a live Alhajda product. Internal apps omit this. */
  href?: string;
};

const P: Audience[] = ["personal"];
const W: Audience[] = ["work"];
const B: Audience[] = ["personal", "work"];

export const LANE_LABEL: Record<Lane, { ar: string; en: string }> = {
  house: { ar: "مواقعنا", en: "Our sites" },
  worship: { ar: "عبادتك", en: "Worship" },
  civic: { ar: "خدماتك", en: "Services" },
  home: { ar: "بيتك", en: "Home" },
  money: { ar: "مالك", en: "Money" },
  health: { ar: "صحتك", en: "Health" },
  day: { ar: "يومك", en: "Your day" },
  tools: { ar: "أدواتك", en: "Tools" },
  play: { ar: "ترفيهك", en: "Play" },
  desk: { ar: "مكتبك", en: "Desk" },
  sales: { ar: "عملاؤك", en: "Clients" },
  team: { ar: "فريقك", en: "Team" },
};

export const PERSONAL_LANES: Lane[] = ["house", "worship", "civic", "home", "money", "health", "day", "tools", "play"];
export const WORK_LANES: Lane[] = ["desk", "sales", "money", "civic", "team", "tools"];

/** Luma lives on `/games` as an external door — never a home heroine. */
export function lumaGamesItem(): CatalogItem | undefined {
  const door = getDoor("luma");
  if (!door) return undefined;
  return {
    id: door.id,
    category: "games",
    lane: "play",
    audience: [...door.audience],
    icon: door.icon,
    title: door.title,
    blurb: door.blurb,
    href: door.href,
  };
}

const LUMA_GAMES = lumaGamesItem();

export const CATALOG: CatalogItem[] = [
  ...launcherDoors().map((door) =>
    door.id === "midad"
      ? {
          id: door.id,
          category: door.category,
          lane: door.lane,
          audience: door.audience,
          portal: true,
          icon: door.icon,
          title: door.title,
          blurb: door.blurb,
        }
      : {
          id: door.id,
          category: door.category,
          lane: door.lane,
          audience: door.audience,
          icon: door.icon,
          title: door.title,
          blurb: door.blurb,
          href: doorExternalHref(door),
        },
  ),
  { id: "salah", category: "life", lane: "worship", audience: P, featured: true, icon: "Sunrise", title: { ar: "مواقيت الصلاة", en: "Prayer times" }, blurb: { ar: "حسب أم القرى مع العدّ للصلاة القادمة", en: "Umm al-Qura times and a countdown to the next prayer" } },
  { id: "salahlog", category: "life", lane: "worship", audience: P, featured: true, icon: "ListChecks", title: { ar: "ورد الصلاة", en: "Prayer log" }, blurb: { ar: "علّم صلوات اليوم وتابع السلسلة", en: "Tick today’s prayers and keep a streak" } },
  { id: "athkar", category: "life", lane: "worship", audience: P, featured: true, icon: "BookOpen", title: { ar: "أذكار اليوم", en: "Daily athkar" }, blurb: { ar: "أذكار الصباح والمساء بعلامة تمّ", en: "Morning and evening remembrances to tick off" } },
  { id: "asma", category: "life", lane: "worship", audience: P, featured: true, fresh: true, icon: "Star", title: { ar: "الأسماء الحسنى", en: "99 Names" }, blurb: { ar: "التسعة والتسعون مع المعنى واسم اليوم", en: "The ninety-nine, with meanings and a name of the day" } },
  { id: "dua", category: "life", lane: "worship", audience: P, fresh: true, icon: "HandHeart", title: { ar: "أدعية", en: "Duas" }, blurb: { ar: "نوم وسفر وطعام ورقية وبعد الصلاة", en: "Sleep, travel, food, ruqyah, and after prayer" } },
  { id: "tasbih", category: "life", lane: "worship", audience: P, icon: "CircleDot", title: { ar: "التسبيح", en: "Tasbih" }, blurb: { ar: "عدّاد ذكر مع أهداف يومية", en: "Dhikr counter with daily goals" } },
  { id: "khatma", category: "life", lane: "worship", audience: P, icon: "BookMarked", title: { ar: "ختمة القرآن", en: "Quran khatma" }, blurb: { ar: "ثلاثون جزءاً حتى تختم", en: "Thirty juz until you complete a reading" } },
  { id: "qibla", category: "life", lane: "worship", audience: P, icon: "Compass", title: { ar: "اتجاه القبلة", en: "Qibla" }, blurb: { ar: "بوصلة دقيقة نحو الكعبة من موقعك", en: "A precise bearing toward the Kaaba" } },
  { id: "hijri", category: "life", lane: "worship", audience: P, icon: "Calendar", title: { ar: "التقويم الهجري", en: "Hijri calendar" }, blurb: { ar: "تحويل التواريخ ومناسبات السنة", en: "Convert dates and see the year’s occasions" } },
  { id: "fasting", category: "life", lane: "worship", audience: P, icon: "Moon", title: { ar: "سجل الصيام", en: "Fasting log" }, blurb: { ar: "رمضان والبيض والاثنين والخميس", en: "Ramadan, white days, Mondays and Thursdays" } },
  { id: "umrah", category: "life", lane: "worship", audience: P, fresh: true, icon: "Tent", title: { ar: "عدّة العمرة", en: "Umrah kit" }, blurb: { ar: "مناسك وحقائب بعلامة تمّ", en: "Rites and a packing list to tick off" } },

  { id: "papers", category: "life", lane: "civic", audience: P, featured: true, icon: "IdCard", title: { ar: "وثائقي", en: "My papers" }, blurb: { ar: "هوية وجواز ورخصة قبل أن تنتهي", en: "ID, passport, and license before they expire" } },
  { id: "services", category: "life", lane: "civic", audience: P, featured: true, icon: "Landmark", title: { ar: "خدمات رقمية", en: "Public services" }, blurb: { ar: "أبشر ونجز والكهرباء والصحة", en: "Absher, Najiz, power, and health" } },
  { id: "holidays", category: "life", lane: "civic", audience: P, fresh: true, icon: "Flag", title: { ar: "إجازات المملكة", en: "Saudi holidays" }, blurb: { ar: "الوطني والتأسيس والأعياد وعدّاد الأيام", en: "National Day, Founding Day, Eids, and a countdown" } },
  { id: "nazari", category: "life", lane: "civic", audience: P, featured: true, fresh: true, icon: "TrafficCone", title: { ar: "نظري القيادة", en: "Driving theory" }, blurb: { ar: "أسئلة تمرين لإشارة وسرعة وحزام", en: "Practice questions on signs, speed, and belts" } },
  { id: "emergency", category: "life", lane: "civic", audience: P, icon: "PhoneCall", title: { ar: "طوارئ", en: "Emergency" }, blurb: { ar: "أرقام النجدة والخدمات العاجلة", en: "Rescue numbers and urgent services" } },

  { id: "shopping", category: "life", lane: "home", audience: P, featured: true, icon: "ShoppingBag", title: { ar: "قائمة التسوق", en: "Shopping list" }, blurb: { ar: "مشتريات المنزل بعلامة تمّ", en: "Household errands you can tick off" } },
  { id: "bills", category: "life", lane: "home", audience: P, featured: true, icon: "CreditCard", title: { ar: "التزاماتي", en: "Bills & subs" }, blurb: { ar: "فواتير واشتراكات حتى لا تتأخر", en: "Bills and subscriptions before they slip" } },
  { id: "names", category: "life", lane: "home", audience: P, featured: true, fresh: true, icon: "Baby", title: { ar: "معاني الأسماء", en: "Name meanings" }, blurb: { ar: "أسماء عربية بنين وبنات ومعناها", en: "Arabic names for boys and girls, with meanings" } },
  { id: "greet", category: "life", lane: "home", audience: P, fresh: true, icon: "Mail", title: { ar: "بطاقات التهنئة", en: "Greetings" }, blurb: { ar: "جمعة ووطن وأعياد وميلاد — انسخ وأرسل", en: "Friday, National Day, Eid, birthday — copy and send" } },
  { id: "car", category: "life", lane: "home", audience: P, icon: "Car", title: { ar: "سيارتي", en: "My car" }, blurb: { ar: "فحص وتأمين وزيت قبل الموعد", en: "Inspection, insurance, and oil before they lapse" } },
  { id: "family", category: "life", lane: "home", audience: P, icon: "Cake", title: { ar: "مناسبات العائلة", en: "Family days" }, blurb: { ar: "أعياد الميلاد قبل أن تفوت", en: "Birthdays before they pass you by" } },
  { id: "countdown", category: "life", lane: "home", audience: P, icon: "Hourglass", title: { ar: "عدّاد مناسباتي", en: "My countdowns" }, blurb: { ar: "كم بقي لسفر أو مناسبة", en: "Days left to a trip or occasion" } },
  { id: "letters", category: "life", lane: "home", audience: P, fresh: true, icon: "BookA", title: { ar: "الحروف للأطفال", en: "Letters for kids" }, blurb: { ar: "ألف باء تاء مع كلمة واستماع", en: "Alif ba ta with a word and audio" } },
  { id: "tables", category: "life", lane: "home", audience: P, fresh: true, icon: "Table2", title: { ar: "جدول الضرب", en: "Times tables" }, blurb: { ar: "الجداول واختبار سريع للصغار", en: "Tables and a quick quiz for kids" } },
  { id: "weather", category: "life", lane: "home", audience: P, featured: true, icon: "CloudSun", title: { ar: "الطقس", en: "Weather" }, blurb: { ar: "حرارة ورطوبة ورياح لمدينتك", en: "Temperature, humidity, and wind for your city" } },
  { id: "clocks", category: "life", lane: "desk", audience: B, icon: "Globe", title: { ar: "الساعات العالمية", en: "World clocks" }, blurb: { ar: "فرق التوقيت بين المدن", en: "Time zones across cities" } },
  { id: "proverbs", category: "life", lane: "day", audience: P, fresh: true, icon: "Quote", title: { ar: "أمثال عربية", en: "Proverbs" }, blurb: { ar: "مثل اليوم من الفصحى ومن دارجنا", en: "A saying of the day — classical and spoken" } },

  { id: "budget", category: "money", lane: "money", audience: P, featured: true, icon: "Wallet", title: { ar: "مصروفات الشهر", en: "Monthly spend" }, blurb: { ar: "حدّ شهري وتتبع أين يذهب مالك", en: "A monthly cap and a log of where money goes" } },
  { id: "zakat", category: "money", lane: "money", audience: P, featured: true, icon: "Coins", title: { ar: "حاسبة الزكاة", en: "Zakat calculator" }, blurb: { ar: "نصاب الذهب و٢٫٥٪ على أموالك الزكوية", en: "Gold nisab and 2.5% on zakatable wealth" } },
  { id: "gold", category: "money", lane: "money", audience: P, featured: true, icon: "Gem", title: { ar: "أسعار الذهب", en: "Gold prices" }, blurb: { ar: "عيار ٢٤ و٢١ و١٨ بالريال", en: "24k, 21k, and 18k in riyals" } },
  { id: "vat", category: "money", lane: "money", audience: B, featured: true, fresh: true, icon: "BadgePercent", title: { ar: "الضريبة والخصم", en: "VAT & discount" }, blurb: { ar: "أضف أو استخرج ١٥٪ واحسب التخفيض", en: "Add or extract 15%, and run a discount" } },
  { id: "salary", category: "money", lane: "money", audience: P, icon: "CircleDollarSign", title: { ar: "صافي الراتب", en: "Net salary" }, blurb: { ar: "بعد التأمينات ٩٫٧٥٪ للمواطن", en: "After 9.75% GOSI for Saudi employees" } },
  { id: "savings", category: "money", lane: "money", audience: P, icon: "PiggyBank", title: { ar: "هدف ادخار", en: "Savings goal" }, blurb: { ar: "كم تحتاج شهرياً لتبلغ هدفك", en: "How much per month to hit your target" } },
  { id: "installment", category: "money", lane: "money", audience: P, icon: "Percent", title: { ar: "حاسبة الأقساط", en: "Installments" }, blurb: { ar: "القسط الشهري لأي مبلغ ومدة", en: "The monthly payment for an amount and term" } },
  { id: "eidiya", category: "money", lane: "money", audience: P, fresh: true, icon: "Gift", title: { ar: "العيدية", en: "Eidiya" }, blurb: { ar: "وزّع العيدية على العيال واحسب المجموع", en: "Share Eid money among the children and total it" } },
  { id: "iban", category: "money", lane: "money", audience: B, fresh: true, icon: "Landmark", title: { ar: "آيبان سعودي", en: "Saudi IBAN" }, blurb: { ar: "تحقق من الرقم واعرف البنك", en: "Validate the number and name the bank" } },
  { id: "split", category: "money", lane: "money", audience: P, icon: "Users", title: { ar: "تقسيم الفاتورة", en: "Split a bill" }, blurb: { ar: "اقسم الحساب على رفاقك بالعدل", en: "Share a check evenly among friends" } },
  { id: "fuel", category: "money", lane: "money", audience: P, icon: "Fuel", title: { ar: "حاسبة الوقود", en: "Fuel cost" }, blurb: { ar: "تكلفة الرحلة بالبنزين ٩١ و٩٥", en: "Trip cost for 91 and 95 petrol" } },
  { id: "currency", category: "money", lane: "money", audience: B, featured: true, icon: "Banknote", title: { ar: "العملات", en: "Currency" }, blurb: { ar: "أسعار حية مع الريال أساساً", en: "Live rates with SAR as the base" } },
  { id: "faraid", category: "money", lane: "money", audience: P, icon: "Scale", title: { ar: "المواريث", en: "Inheritance" }, blurb: { ar: "توزيع مبسّط للزوج والأولاد والأبوين", en: "A simple split for spouse, children, and parents" } },
  { id: "expenses", category: "money", lane: "money", audience: W, featured: true, fresh: true, icon: "WalletCards", title: { ar: "مصروفات العمل", en: "Work expenses" }, blurb: { ar: "فواتير المصروف حتى تُعوَّض", en: "Out-of-pocket costs until they are repaid" } },
  { id: "margin", category: "money", lane: "money", audience: W, fresh: true, icon: "TrendingUp", title: { ar: "هامش الربح", en: "Margin" }, blurb: { ar: "من التكلفة إلى سعر البيع", en: "From cost to a selling price" } },
  { id: "payroll", category: "money", lane: "money", audience: W, featured: true, fresh: true, icon: "Briefcase", title: { ar: "رواتب الفريق", en: "Payroll" }, blurb: { ar: "صافي الموظف وتكلفة المنشأة بعد التأمينات", en: "Net pay and company cost after GOSI" } },
  { id: "cashbook", category: "money", lane: "money", audience: W, fresh: true, icon: "BookOpen", title: { ar: "الصندوق", en: "Cashbook" }, blurb: { ar: "وارد وصادر ورصيد اليوم", en: "In, out, and today’s balance" } },
  { id: "tafqeet", category: "tools", lane: "money", audience: B, fresh: true, icon: "ScrollText", title: { ar: "التفقيط", en: "Tafqeet" }, blurb: { ar: "حوّل المبلغ إلى كلام عربي للفواتير", en: "Turn an amount into Arabic words for invoices" } },

  { id: "water", category: "life", lane: "health", audience: P, icon: "Droplets", title: { ar: "شرب الماء", en: "Water log" }, blurb: { ar: "أكوابك اليومية حتى هدفك", en: "Daily glasses toward your goal" } },
  { id: "meds", category: "life", lane: "health", audience: P, icon: "Pill", title: { ar: "أدويتي", en: "My meds" }, blurb: { ar: "جرعات اليوم بعلامة تمّ", en: "Today’s doses, ticked off" } },
  { id: "bmi", category: "tools", lane: "health", audience: P, icon: "HeartPulse", title: { ar: "مؤشر الكتلة", en: "BMI" }, blurb: { ar: "حساب بسيط للطول والوزن", en: "A simple height and weight check" } },
  { id: "sleep", category: "life", lane: "health", audience: P, fresh: true, icon: "BedDouble", title: { ar: "دورات النوم", en: "Sleep cycles" }, blurb: { ar: "متى تنام أو تستيقظ بعد دورات ٩٠ دقيقة", en: "When to sleep or wake after 90-minute cycles" } },
  { id: "calories", category: "life", lane: "health", audience: P, fresh: true, icon: "Utensils", title: { ar: "السعرات", en: "Calories" }, blurb: { ar: "احتياجك اليومي للثبات أو النقص الهادئ", en: "Daily need to maintain or ease down" } },
  { id: "breathe", category: "life", lane: "health", audience: P, fresh: true, icon: "Wind", title: { ar: "التنفس", en: "Breathe" }, blurb: { ar: "تمرين ٤-٧-٨ لتهدأ في دقيقة", en: "A 4-7-8 exercise to settle in a minute" } },
  { id: "pregnancy", category: "life", lane: "health", audience: P, fresh: true, icon: "HeartHandshake", title: { ar: "حاسبة الحمل", en: "Pregnancy week" }, blurb: { ar: "الأسبوع والثلث وموعد الولادة المتوقع", en: "Week, trimester, and an estimated due date" } },

  { id: "notes", category: "workspace", lane: "desk", audience: B, featured: true, icon: "StickyNote", title: { ar: "الملاحظات", en: "Notes" }, blurb: { ar: "دفاتر سريعة تُحفظ على جهازك", en: "Quick notebooks saved on this device" } },
  { id: "tasks", category: "workspace", lane: "desk", audience: B, featured: true, icon: "ListTodo", title: { ar: "المهام", en: "Tasks" }, blurb: { ar: "قوائم بأولويات", en: "To-dos with priorities" } },
  { id: "habits", category: "workspace", lane: "day", audience: P, icon: "Flame", title: { ar: "العادات", en: "Habits" }, blurb: { ar: "سلاسل يومية لما تريد المداومة عليه", en: "Daily streaks for what you want to keep" } },
  { id: "focus", category: "workspace", lane: "desk", audience: B, icon: "Timer", title: { ar: "بؤرة التركيز", en: "Focus timer" }, blurb: { ar: "بومودورو للعمل العميق", en: "Pomodoro for deep work" } },
  { id: "markdown", category: "workspace", lane: "desk", audience: W, icon: "FileText", title: { ar: "محرر ماركداون", en: "Markdown pad" }, blurb: { ar: "كتابة ومعاينة فورية", en: "Write and preview instantly" } },
  { id: "meetings", category: "workspace", lane: "desk", audience: W, featured: true, fresh: true, icon: "CalendarDays", title: { ar: "الاجتماعات", en: "Meetings" }, blurb: { ar: "جدول ونقاط ومتابعات", en: "Agenda, notes, and follow-ups" } },
  { id: "letter", category: "workspace", lane: "desk", audience: W, fresh: true, icon: "FileSignature", title: { ar: "الخطاب الرسمي", en: "Official letter" }, blurb: { ar: "نماذج عربية للطباعة", en: "Arabic templates, ready to print" } },
  { id: "timesheet", category: "workspace", lane: "team", audience: W, featured: true, fresh: true, icon: "Clock", title: { ar: "سجل الساعات", en: "Timesheet" }, blurb: { ar: "مؤقّت مشاريع وساعات اليوم", en: "A project timer and today’s hours" } },
  { id: "leave", category: "workspace", lane: "team", audience: W, fresh: true, icon: "Palmtree", title: { ar: "إجازات الفريق", en: "Team leave" }, blurb: { ar: "سنوية ومرضية بلا أوراق", en: "Annual and sick leave, on-device" } },

  { id: "clients", category: "workspace", lane: "sales", audience: W, featured: true, fresh: true, icon: "Contact", title: { ar: "العملاء", en: "Clients" }, blurb: { ar: "أسماء وهواتف ومتابعة", en: "Names, phones, and a follow-up note" } },
  { id: "pipeline", category: "workspace", lane: "sales", audience: W, featured: true, fresh: true, icon: "Kanban", title: { ar: "الصفقات", en: "Pipeline" }, blurb: { ar: "فرصة ثم عرض ثم إغلاق", en: "Lead, offer, then close" } },
  { id: "quote", category: "workspace", lane: "sales", audience: W, featured: true, fresh: true, icon: "FileSpreadsheet", title: { ar: "عرض السعر", en: "Quotation" }, blurb: { ar: "عرض عربي بضريبة ١٥٪", en: "An Arabic quote with 15% VAT" } },
  { id: "invoice", category: "workspace", lane: "sales", audience: W, featured: true, icon: "Receipt", title: { ar: "الفاتورة", en: "Invoice" }, blurb: { ar: "فاتورة عربية ورمز هيئة الزكاة", en: "Arabic invoice with a ZATCA QR" } },
  { id: "zatca", category: "workspace", lane: "sales", audience: W, featured: true, fresh: true, icon: "QrCode", title: { ar: "رمز الفاتورة", en: "ZATCA QR" }, blurb: { ar: "TLV المرحلة الأولى للفاتورة المبسّطة", en: "Phase-1 TLV for a simplified e-invoice" } },

  { id: "licenses", category: "workspace", lane: "civic", audience: W, featured: true, fresh: true, icon: "Stamp", title: { ar: "رخص المنشأة", en: "Business licenses" }, blurb: { ar: "سجل وبلدي وضريبة قبل أن تنتهي", en: "CR, municipal, and VAT before they lapse" } },
  { id: "portals", category: "workspace", lane: "civic", audience: W, featured: true, fresh: true, icon: "Building2", title: { ar: "بوابات العمل", en: "Work portals" }, blurb: { ar: "قوى والتأمينات وهيئة الزكاة", en: "Qiwa, GOSI, and ZATCA" } },

  { id: "madar", category: "tools", lane: "tools", audience: B, portal: true, icon: "Madar", title: { ar: "مدار", en: "Madar" }, blurb: { ar: "بوابة تصفّح وبحث — مدار يحيط", en: "A browse and search gate — an orbit that holds" } },
  { id: "clips", category: "tools", lane: "tools", audience: B, portal: true, icon: "Clips", title: { ar: "مقاطع مفيدة", en: "Useful clips" }, blurb: { ar: "اثنا عشر مقطعاً معلَّماً — بلا خوارزمية ولا بحث", en: "Twelve marked clips — no algorithm, no search" } },
  { id: "calc", category: "tools", lane: "tools", audience: B, featured: true, icon: "Calculator", title: { ar: "الحاسبة", en: "Calculator" }, blurb: { ar: "علمية مع تاريخ العمليات", en: "Scientific, with a history tape" } },
  { id: "units", category: "tools", lane: "tools", audience: P, icon: "Ruler", title: { ar: "تحويل الوحدات", en: "Unit converter" }, blurb: { ar: "طول ووزن وحجم وحرارة", en: "Length, mass, volume, and temperature" } },
  { id: "password", category: "tools", lane: "tools", audience: B, icon: "KeyRound", title: { ar: "مولّد كلمات المرور", en: "Password generator" }, blurb: { ar: "كلمات قوية تُولَّد على جهازك", en: "Strong passwords, generated on-device" } },
  { id: "qr", category: "tools", lane: "tools", audience: B, icon: "QrCode", title: { ar: "رموز QR", en: "QR codes" }, blurb: { ar: "أنشئ رمزاً لأي رابط أو نص", en: "Make a code for any link or text" } },
  { id: "dates", category: "tools", lane: "tools", audience: P, icon: "CalendarClock", title: { ar: "حاسبة التواريخ", en: "Date lab" }, blurb: { ar: "العمر والفروق بين الأيام", en: "Age and the span between days" } },
  { id: "wheel", category: "tools", lane: "tools", audience: B, fresh: true, icon: "Dices", title: { ar: "عجلة القرار", en: "Decision wheel" }, blurb: { ar: "أدر العجلة إذا تحيّرت بين خيارين", en: "Spin when you cannot choose" } },
  { id: "colors", category: "tools", lane: "desk", audience: W, icon: "Palette", title: { ar: "مختبر الألوان", en: "Color studio" }, blurb: { ar: "تباين ولوحات وتدرجات", en: "Contrast, palettes, and shades" } },
  { id: "textlab", category: "tools", lane: "desk", audience: W, icon: "Type", title: { ar: "مختبر النص", en: "Text lab" }, blurb: { ar: "عدّ، تحويل حالة، وترتيب", en: "Count, case, sort, and clean" } },
  { id: "json", category: "tools", lane: "desk", audience: W, icon: "Braces", title: { ar: "منسّق JSON", en: "JSON formatter" }, blurb: { ar: "تنسيق وفحص للبيانات", en: "Pretty-print and validate" } },
  { id: "encode", category: "tools", lane: "desk", audience: W, icon: "Binary", title: { ar: "الترميز", en: "Encode" }, blurb: { ar: "Base64 وURL وتجزئة", en: "Base64, URL, and hashing" } },

  ...(LUMA_GAMES ? [LUMA_GAMES] : []),
  { id: "kalima", category: "games", lane: "play", audience: P, icon: "WholeWord", title: { ar: "كلمة", en: "Kalima" }, blurb: { ar: "خمسة أحرف، ست محاولات — عربي وإنجليزي، وكلمة اليوم", en: "Five letters, six tries — Arabic and English, and a word of the day" } },
  { id: "abiar", category: "games", lane: "play", audience: P, icon: "Droplets", title: { ar: "آبار", en: "Wells" }, blurb: { ar: "اسكب الألوان حتى يستقر كل بئر", en: "Pour the colours until every well is still" } },
  { id: "majra", category: "games", lane: "play", audience: P, icon: "Waves", title: { ar: "مجرى", en: "Stream" }, blurb: { ar: "أدر القنوات حتى يجري الماء من العين", en: "Turn the channels until water leaves the spring" } },
  { id: "kutl", category: "games", lane: "play", audience: P, icon: "Boxes", title: { ar: "كتل", en: "Blocks" }, blurb: { ar: "ضع الكتل وامسح الصفوف والأعمدة", en: "Place the blocks and clear rows and columns" } },
  { id: "memory", category: "games", lane: "play", audience: P, icon: "LayoutGrid", title: { ar: "ذاكرة", en: "Memory" }, blurb: { ar: "اكتشف أزواج الواحة في أقل حركات", en: "Find the oasis pairs in as few moves as you can" } },
  { id: "snake", category: "games", lane: "play", audience: P, icon: "Spline", title: { ar: "الثعبان", en: "Snake" }, blurb: { ar: "كلاسيكية الشبكة والسرعة", en: "The classic grid chase" } },
  { id: "merge2048", category: "games", lane: "play", audience: P, icon: "Grid2x2", title: { ar: "٢٠٤٨", en: "2048" }, blurb: { ar: "ادمج البلاطات حتى ٢٠٤٨", en: "Slide tiles until you hit 2048" } },
  { id: "tetris", category: "games", lane: "play", audience: P, icon: "Blocks", title: { ar: "تتريس", en: "Tetris" }, blurb: { ar: "لبنات كلاسيكية مع احتفاظ وشبح", en: "Classic pieces, with hold and a ghost" } },
  { id: "connect4", category: "games", lane: "play", audience: P, fresh: true, icon: "Columns3", title: { ar: "أربعة في صف", en: "Connect four" }, blurb: { ar: "ضد واحة أو مع جليس بجانبك", en: "Against Waha or the person beside you" } },
  { id: "baloot", category: "games", lane: "play", audience: P, icon: "Diamond", title: { ar: "بلوت", en: "Baloot" }, blurb: { ar: "عداد لنا ولهم حتى ١٥٢", en: "Us and them, playing to 152" } },
  { id: "sudoku", category: "games", lane: "play", audience: P, icon: "Hash", title: { ar: "سودوكو", en: "Sudoku" }, blurb: { ar: "ألغاز مولَّدة بثلاثة مستويات", en: "Generated puzzles in three difficulties" } },
  { id: "xo", category: "games", lane: "play", audience: P, icon: "X", title: { ar: "إكس أو", en: "Tic-tac-toe" }, blurb: { ar: "ضد خصم لا يخطئ إن أردت", en: "Play a perfect opponent if you dare" } },
  { id: "reaction", category: "games", lane: "play", audience: P, icon: "Zap", title: { ar: "سرعة الرد", en: "Reaction" }, blurb: { ar: "اختبر زمن استجابتك", en: "Test your response time" } },
  { id: "type", category: "games", lane: "play", audience: P, icon: "Keyboard", title: { ar: "سباق الكتابة", en: "Type race" }, blurb: { ar: "كلمات في الدقيقة بالعربي والإنجليزي", en: "Words per minute in Arabic and English" } },
  { id: "breakout", category: "games", lane: "play", audience: P, icon: "BrickWall", title: { ar: "محطّم الطوب", en: "Breakout" }, blurb: { ar: "كرة ومضرب وجدار", en: "Paddle, ball, and a wall of bricks" } },
  { id: "trivia", category: "games", lane: "play", audience: P, icon: "HelpCircle", title: { ar: "تحدّي المعلومات", en: "Trivia" }, blurb: { ar: "أسئلة عامة وتاريخ وجغرافيا", en: "General knowledge, history, and geography" } },
  { id: "mines", category: "games", lane: "play", audience: P, icon: "Bomb", title: { ar: "الألغام", en: "Mines" }, blurb: { ar: "اكشف الحقل دون أن تلمس لغماً", en: "Clear the field without a mine" } },

  { id: "chat", category: "studio", lane: "day", audience: B, featured: true, icon: "Sparkles", title: { ar: "واحة للذكاء", en: "Waha AI" }, blurb: { ar: "اسأل واحة — يومك، ومصدر إن وُجد", en: "Ask Waha — your day, and a source if we have one" } },
];

export const CATEGORIES: { id: Category; path: string }[] = [
  { id: "life", path: "/life" },
  { id: "money", path: "/money" },
  { id: "tools", path: "/tools" },
  { id: "games", path: "/games" },
  { id: "workspace", path: "/workspace" },
  { id: "studio", path: "/studio" },
];

export function getApp(id: string) {
  return CATALOG.find((a) => a.id === id);
}

export function forAudience(audience: Audience) {
  return CATALOG.filter((a) => a.audience.includes(audience));
}

export function byCategory(cat: Category, audience: Audience) {
  return CATALOG.filter((a) => a.category === cat && a.audience.includes(audience));
}

export function byLane(lane: Lane, audience: Audience) {
  return CATALOG.filter((a) => a.lane === lane && a.audience.includes(audience));
}

export function featuredFor(audience: Audience) {
  return CATALOG.filter((a) => a.featured && a.audience.includes(audience));
}

export function featuredForHome(audience: Audience) {
  return forSeriousHome(featuredFor(audience));
}

export { forSeriousHome, isPlayItem } from "@/lib/home-lock";

export function freshFor(audience: Audience) {
  return CATALOG.filter((a) => a.fresh && a.audience.includes(audience));
}

export function lanesPresent(items: CatalogItem[]): Lane[] {
  const seen = new Set(items.map((i) => i.lane));
  const order = [...PERSONAL_LANES];
  for (const l of WORK_LANES) if (!order.includes(l)) order.push(l);
  return order.filter((l) => seen.has(l));
}

export function searchCatalog(q: string, audience: Audience) {
  const n = q.trim().toLowerCase();
  const pool = forAudience(audience);
  if (!n) return pool;
  return pool.filter((a) => {
    const keys = [a.id, a.title.ar, a.title.en, a.blurb.ar, a.blurb.en, LANE_LABEL[a.lane].ar, LANE_LABEL[a.lane].en, a.href ?? ""];
    if (a.lane === "house" || a.href) keys.push("الهجدة", "alhajda", "أبواب");
    if (a.id === "midad") keys.push("كتب", "رف", "books", "shelf", "/books");
    return keys.some((s) => s.toLowerCase().includes(n));
  });
}
