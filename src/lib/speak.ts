export function speak(text: string, lang: "ar" | "en" = "ar") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ar" ? "ar-SA" : "en-GB";
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}
