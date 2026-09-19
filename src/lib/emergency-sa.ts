import { copy, loc, type Copy, type Lang } from "@/lib/locale";

/** Official Saudi emergency numbers only — no unofficial or commercial lines. */
export type EmergencyLine = {
  n: string;
  title: Copy;
};

export const SA_EMERGENCY: EmergencyLine[] = [
  { n: "911", title: copy("الطوارئ الموحد", "Unified emergency", "统一应急", "Emergencia unificada", "Urgence unifiée", "एकीकृत आपातकाल") },
  { n: "997", title: copy("الهلال الأحمر", "Red Crescent", "红新月会", "Media Luna Roja", "Croissant-Rouge", "रेड क्रिसेंट") },
  { n: "998", title: copy("الدفاع المدني", "Civil Defense", "民防", "Defensa Civil", "Protection civile", "सिविल डिफेंस") },
  { n: "999", title: copy("الشرطة", "Police", "警察", "Policía", "Police", "पुलिस") },
  { n: "993", title: copy("المرور", "Traffic", "交管", "Tráfico", "Circulation", "यातायात") },
  { n: "937", title: copy("وزارة الصحة", "Ministry of Health", "卫生部", "Ministerio de Salud", "Ministère de la Santé", "स्वास्थ्य मंत्रालय") },
  { n: "933", title: copy("الشركة السعودية للكهرباء", "Saudi Electricity", "沙特电力", "Electricidad saudí", "Électricité saoudienne", "सऊदी बिजली") },
];

/** Compact strip for family / elder — the four numbers people actually call first. */
export const SA_EMERGENCY_STRIP = SA_EMERGENCY.filter((row) =>
  ["911", "997", "998", "999"].includes(row.n),
);

export const SA_EMERGENCY_SEGMENTS = ["family", "elder"] as const;

export function emergencyTitle(lang: Lang, line: EmergencyLine) {
  return loc(lang, line.title);
}

export function isOfficialSaNumber(n: string) {
  return SA_EMERGENCY.some((row) => row.n === n);
}
