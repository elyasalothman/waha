export type City = {
  id: string;
  ar: string;
  en: string;
  lat: number;
  lon: number;
  tz: string;
  countryAr: string;
  countryEn: string;
};

export const CITIES: City[] = [
  { id: "riyadh", ar: "الرياض", en: "Riyadh", lat: 24.7136, lon: 46.6753, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "jeddah", ar: "جدة", en: "Jeddah", lat: 21.5433, lon: 39.1728, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "makkah", ar: "مكة المكرمة", en: "Makkah", lat: 21.3891, lon: 39.8579, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "madinah", ar: "المدينة المنورة", en: "Madinah", lat: 24.5247, lon: 39.5692, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "dammam", ar: "الدمام", en: "Dammam", lat: 26.4207, lon: 50.0888, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "khobar", ar: "الخبر", en: "Khobar", lat: 26.2172, lon: 50.1971, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "taif", ar: "الطائف", en: "Taif", lat: 21.2703, lon: 40.4158, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "abha", ar: "أبها", en: "Abha", lat: 18.2164, lon: 42.5053, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "tabuk", ar: "تبوك", en: "Tabuk", lat: 28.3838, lon: 36.555, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "buraidah", ar: "بريدة", en: "Buraidah", lat: 26.326, lon: 43.975, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "hail", ar: "حائل", en: "Hail", lat: 27.5114, lon: 41.69, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "jazan", ar: "جازان", en: "Jazan", lat: 16.8892, lon: 42.5511, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "najran", ar: "نجران", en: "Najran", lat: 17.4924, lon: 44.1277, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "yanbu", ar: "ينبع", en: "Yanbu", lat: 24.0896, lon: 38.0618, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "jubail", ar: "الجبيل", en: "Jubail", lat: 27.0046, lon: 49.6225, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "hofuf", ar: "الهفوف", en: "Hofuf", lat: 25.3646, lon: 49.5856, tz: "Asia/Riyadh", countryAr: "السعودية", countryEn: "Saudi Arabia" },
  { id: "dubai", ar: "دبي", en: "Dubai", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai", countryAr: "الإمارات", countryEn: "UAE" },
  { id: "kuwait", ar: "الكويت", en: "Kuwait", lat: 29.3759, lon: 47.9774, tz: "Asia/Kuwait", countryAr: "الكويت", countryEn: "Kuwait" },
  { id: "doha", ar: "الدوحة", en: "Doha", lat: 25.2854, lon: 51.531, tz: "Asia/Qatar", countryAr: "قطر", countryEn: "Qatar" },
  { id: "manama", ar: "المنامة", en: "Manama", lat: 26.2285, lon: 50.586, tz: "Asia/Bahrain", countryAr: "البحرين", countryEn: "Bahrain" },
  { id: "muscat", ar: "مسقط", en: "Muscat", lat: 23.588, lon: 58.3829, tz: "Asia/Muscat", countryAr: "عُمان", countryEn: "Oman" },
  { id: "amman", ar: "عمّان", en: "Amman", lat: 31.9539, lon: 35.9106, tz: "Asia/Amman", countryAr: "الأردن", countryEn: "Jordan" },
  { id: "cairo", ar: "القاهرة", en: "Cairo", lat: 30.0444, lon: 31.2357, tz: "Africa/Cairo", countryAr: "مصر", countryEn: "Egypt" },
  { id: "istanbul", ar: "إسطنبول", en: "Istanbul", lat: 41.0082, lon: 28.9784, tz: "Europe/Istanbul", countryAr: "تركيا", countryEn: "Turkey" },
  { id: "london", ar: "لندن", en: "London", lat: 51.5074, lon: -0.1278, tz: "Europe/London", countryAr: "بريطانيا", countryEn: "UK" },
  { id: "paris", ar: "باريس", en: "Paris", lat: 48.8566, lon: 2.3522, tz: "Europe/Paris", countryAr: "فرنسا", countryEn: "France" },
  { id: "nyc", ar: "نيويورك", en: "New York", lat: 40.7128, lon: -74.006, tz: "America/New_York", countryAr: "أمريكا", countryEn: "USA" },
  { id: "tokyo", ar: "طوكيو", en: "Tokyo", lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo", countryAr: "اليابان", countryEn: "Japan" },
];

export const DEFAULT_CITY = CITIES[0]!;

export function findCity(id: string) {
  return CITIES.find((c) => c.id === id) ?? DEFAULT_CITY;
}
