export type Proverb = { ar: string; en: string };

export const PROVERBS: Proverb[] = [
  { ar: "في التأني السلامة وفي العجلة الندامة", en: "Safety lies in patience; haste brings regret." },
  { ar: "الصبر مفتاح الفرج", en: "Patience is the key to relief." },
  { ar: "من جدّ وجد", en: "Whoever strives, finds." },
  { ar: "اطلبوا العلم من المهد إلى اللحد", en: "Seek knowledge from the cradle to the grave." },
  { ar: "إذا كان الكلام من فضة فالسكوت من ذهب", en: "If speech is silver, silence is gold." },
  { ar: "اليد العليا خير من اليد السفلى", en: "The upper hand is better than the lower." },
  { ar: "ربّ أخ لك لم تلده أمك", en: "You may have a brother your mother never bore." },
  { ar: "الوقاية خير من العلاج", en: "Prevention is better than cure." },
  { ar: "عصفور في اليد خير من عشرة على الشجرة", en: "A bird in the hand is worth ten on the tree." },
  { ar: "كل إناء بالذي فيه ينضح", en: "Every vessel seeps what it holds." },
  { ar: "من راقب الناس مات همّاً", en: "Whoever watches people dies of worry." },
  { ar: "الوقت كالسيف إن لم تقطعه قطعك", en: "Time is a sword: cut it, or it cuts you." },
  { ar: "جسمك لا يحتمل كل ما يهواه قلبك", en: "The body cannot bear all the heart desires." },
  { ar: "إذا تمّ العقل نقص الكلام", en: "When reason is complete, speech grows less." },
  { ar: "خير الأمور أوسطها", en: "The best of affairs is the middle way." },
  { ar: "لا تؤجل عمل اليوم إلى الغد", en: "Do not put off today’s work until tomorrow." },
  { ar: "اللي ما يعرف الصقر يشويه", en: "He who doesn’t know a falcon will roast it." },
  { ar: "حط في راسك ثلج", en: "Put ice on your head — stay calm." },
  { ar: "العين ما تعارض الحاجب", en: "The eye does not oppose the brow." },
  { ar: "اللي يبيه البيت يكفيه", en: "What the house wants, it finds enough." },
  { ar: "امشِ سنة ولا تتعدَّ نهر", en: "Walk a year rather than cross a river." },
  { ar: "القناعة كنز لا يفنى", en: "Contentment is a treasure that never ends." },
  { ar: "من حفر حفرة لأخيه وقع فيها", en: "Whoever digs a pit for his brother falls in it." },
  { ar: "الكلام يجرّ الكلام", en: "Talk leads to more talk." },
  { ar: "صاحب الحاجة أرعن", en: "The one in need is impatient." },
  { ar: "ما حكّ جلدك مثل ظفرك", en: "No one scratches your skin like your own nail." },
  { ar: "البعيد عن العين بعيد عن القلب", en: "Far from the eye, far from the heart." },
  { ar: "آخر الدواء الكيّ", en: "Cautery is the last of medicines." },
  { ar: "إذا غامرتَ في شرفٍ مرومٍ فلا تقنع بما دون النجوم", en: "If you risk yourself for honour, settle for nothing beneath the stars." },
  { ar: "ما كل ما يتمنى المرء يدركه", en: "Not all a person wishes for comes to pass." },
  { ar: "تجري الرياح بما لا تشتهي السفن", en: "Winds blow as ships do not wish." },
  { ar: "عند الشدائد يُعرف الإخوان", en: "In hardship, brothers are known." },
  { ar: "العلم في الصغر كالنقش في الحجر", en: "Learning in youth is like carving in stone." },
  { ar: "صديقك من صدقك لا من صدّقك", en: "Your friend is the one who tells you the truth, not the one who believes you." },
  { ar: "أول الغيث قطرة", en: "The first of rain is a drop." },
  { ar: "كل تأخيرة فيها خيرة", en: "In every delay there is a good." },
  { ar: "الناس على دين ملوكهم", en: "People follow the ways of their rulers." },
  { ar: "من شبّ على شيء شاب عليه", en: "What you grow up on, you grow old with." },
  { ar: "درهم وقاية خير من قنطار علاج", en: "A dirham of prevention is better than a qintar of cure." },
  { ar: "اللي ما عنده كبير يشتري له كبير", en: "Whoever has no elder should find himself one." },
];

export function proverbOfDay(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0).getTime();
  const day = Math.floor((d.getTime() - start) / 86400000);
  return PROVERBS[day % PROVERBS.length]!;
}
