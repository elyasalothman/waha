export const welcomeHead = () => ({
  meta: [
    { title: "واحة — يومك كله في مكان واحد" },
    {
      name: "description",
      content:
        "واحتك العربية للقرآن والأخبار والكتب والألعاب ومحسن. اكتشف مواقع بيت الهجدة، وجرّب مجانًا دون حساب.",
    },
    { property: "og:title", content: "يومك كله في واحة" },
    {
      property: "og:description",
      content: "اقرأ، تعلّم، العب… وخذ نفسًا. مساحة عربية تجمع تفاصيل يومك من بيت الهجدة.",
    },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "ar_SA" },
    { property: "og:image", content: "https://waha.hajdah.com/og.jpg" },
    { property: "og:image:alt", content: "واحة — واحتك الرقمية من بيت الهجدة" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
  scripts: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "واحة",
        url: "https://waha.hajdah.com",
        inLanguage: "ar",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        description: "القرآن والأخبار والكتب والألعاب وأدوات يومك العربية",
        offers: { "@type": "Offer", price: "0", priceCurrency: "SAR" },
      }),
    },
  ],
});
