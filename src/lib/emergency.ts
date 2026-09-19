/**
 * Official Kingdom of Saudi Arabia numbers for the family/senior strip.
 * Labels follow Interior / Red Crescent / Civil Defense / MOH naming:
 * - 911: الرقم الموحد للطوارئ (since 2017)
 * - 997: الهلال الأحمر السعودي (ambulance)
 * - 998: الدفاع المدني (fire and rescue)
 * - 937: صحة ٩٣٧ — مركز استشارات وزارة الصحة (advice, not ambulance)
 */
export type EmergencyNumber = {
  n: string;
  ar: string;
  en: string;
};

export const FAMILY_EMERGENCY_NUMBERS: readonly EmergencyNumber[] = [
  { n: "911", ar: "الطوارئ الموحد", en: "Unified emergency" },
  { n: "997", ar: "الهلال الأحمر", en: "Saudi Red Crescent" },
  { n: "998", ar: "الدفاع المدني", en: "Civil Defense" },
  { n: "937", ar: "صحة ٩٣٧", en: "Seha 937" },
];

export const FAMILY_EMERGENCY_DIGITS = FAMILY_EMERGENCY_NUMBERS.map((row) => row.n);

export function emergencyTel(n: string): string {
  return `tel:${n}`;
}
