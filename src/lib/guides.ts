// Blog posts and service descriptions for the public site.
// Every fact below comes from the client's product catalogue (scripts/data/product-catalog.json). No testimonials,
// statistics or health outcomes are invented. Add real articles here (or move them to the database later).

export type GuideSection = { heading?: string; paragraphs?: string[]; list?: string[] };
export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date
  readMinutes: number;
  image: string;
  productSlug?: string;
  sections: GuideSection[];
};

const img = (slug: string, n = 1) => `/assets/products/${slug}/${n}.webp`;

export const GUIDES: Guide[] = [
  {
    slug: 'how-to-take-special-15',
    title: 'How to take Special 15: dose, timing and how long a bottle lasts',
    excerpt: 'A simple routine for Special 15 with Goodness of Noni, from the first shake of the bottle to refilling your shelf.',
    date: '2026-11-02',
    readMinutes: 3,
    image: img('special-15-noni-juice-500ml', 2),
    productSlug: 'special-15-noni-juice-500ml',
    sections: [
      { paragraphs: ['Special 15 is a herbal wellness juice built around Noni with 15 traditional herbs. It is meant to be part of a daily routine, so it helps to know exactly how to take it.'] },
      { heading: 'The dose', paragraphs: ['Take 15 to 20 ml twice a day after meals, or as directed by your healthcare professional.'], list: ['Shake the bottle well.', 'Measure 15 to 20 ml.', 'Take it after lunch and after dinner. You can dilute it in a little water if you prefer.'] },
      { heading: 'How long one bottle lasts', paragraphs: ['At 20 ml twice a day, a 500 ml bottle lasts about 12 days. If you take 15 ml each time, it lasts a little longer.'] },
      { heading: 'Before you start', paragraphs: ['If you take medicine for blood sugar, blood pressure or any long-term condition, check with your doctor first. It is not recommended during pregnancy or breastfeeding without medical advice. Store it in a cool, dry place away from direct sunlight and close the cap tightly after use.'] },
    ],
  },
  {
    slug: 'herbs-in-special-15',
    title: 'Meet the 16 herbs behind Special 15',
    excerpt: 'Noni, Ashwagandha, Giloy, Shilajit and more: what each ingredient is and where it comes from.',
    date: '2026-11-02',
    readMinutes: 3,
    image: img('special-15-noni-juice-500ml', 3),
    productSlug: 'special-15-noni-juice-500ml',
    sections: [
      { paragraphs: ['Special 15 combines Noni with a set of traditional Ayurvedic herbs. Here is the full list with botanical names, so you know exactly what is in the bottle.'] },
      { heading: 'Ingredients', list: ['Noni (Morinda citrifolia)', 'Ashwagandha (Withania somnifera)', 'Vidarikand (Pueraria tuberosa)', 'Karela (Momordica charantia)', 'Jamun (Syzygium cumini)', 'Brahmi (Bacopa monnieri)', 'Giloy (Tinospora cordifolia)', 'Shilajit (Asphaltum punjabianum)', 'Gudmar (Gymnema sylvestre)', 'Neem (Azadirachta indica)', 'Safed Musli (Chlorophytum borivilianum)', 'Kali Musli (Curculigo orchioides)', 'Dalchini (Cinnamomum zeylanicum)', 'Javitri (Myristica fragrans)', 'Pippali (Piper longum)', 'Mulethi (Glycyrrhiza glabra)'] },
      { heading: 'Made in Jaipur', paragraphs: ['Special 15 is manufactured by Shri Amrit Herbals in a GMP certified facility in Jaipur, Rajasthan, and marketed by Shri Jaya Ayur Neuro Private Limited.'] },
    ],
  },
  {
    slug: 'five-tulsi-in-panchamrit-drop',
    title: 'Five kinds of Tulsi in one small bottle',
    excerpt: 'Rama, Shyama, Vana, Kapoor and Sweet Basil: what is in Panchamrit Tulsi Drop and how to use it.',
    date: '2026-11-02',
    readMinutes: 2,
    image: img('panchamrit-tulsi-drop-30ml', 2),
    productSlug: 'panchamrit-tulsi-drop-30ml',
    sections: [
      { paragraphs: ['Tulsi has a revered place in Ayurveda and in Indian homes. Panchamrit Tulsi Drop brings five varieties together in a concentrated 30 ml dropper bottle.'] },
      { heading: 'The five varieties', list: ['Rama Tulsi (Ocimum sanctum)', 'Shyama Tulsi (Ocimum tenuiflorum)', 'Vana Tulsi (Ocimum gratissimum)', 'Kapoor Tulsi (Ocimum kilimandscharicum)', 'Sweet Basil (Ocimum basilicum)'] },
      { heading: 'How to use it', paragraphs: ['It is concentrated, so always dilute it. Add 5 to 10 drops to a cup of warm water or tea, 2 to 3 times a day, or as directed by a healthcare professional. With regular daily use, a bottle lasts around 3 to 4 weeks.'] },
      { paragraphs: ['Pregnant or breastfeeding women should consult a doctor first, and children should only use it on a healthcare professional\'s advice.'] },
    ],
  },
  {
    slug: 'how-to-use-ortho-go-oil',
    title: 'Getting the most from a massage oil: Ortho Go Oil, step by step',
    excerpt: 'Warm it, apply it, massage it: a short guide to using Shri Ortho Go Oil safely.',
    date: '2026-11-02',
    readMinutes: 2,
    image: img('shri-ortho-go-oil-50ml', 5),
    productSlug: 'shri-ortho-go-oil-50ml',
    sections: [
      { paragraphs: ['Shri Ortho Go Oil is an Ayurvedic massage oil blended from 14 herbal and essential oils in a Sesame and Castor oil base. It is for external use only.'] },
      { heading: 'Step by step', list: ['Warm the oil slightly before use if you like. This is optional.', 'Apply a small amount to the area, such as the knee, back, neck or shoulder.', 'Massage gently in a circular motion for 5 to 10 minutes.', 'Wash your hands after use. Use it twice a day.'] },
      { heading: 'Safety', paragraphs: ['Avoid contact with eyes and open wounds. Do a patch test first if you have sensitive skin. It is not for use during pregnancy without medical advice. Keep out of reach of children.'] },
    ],
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null;

export const SERVICES = [
  {
    title: 'Ayurvedic product range',
    body: 'Nine formulations across immunity, digestion and liver care, joint care, women\'s health, weight management and oral care, each with its full ingredient list on the product page.',
    href: '/shop', cta: 'Browse the shop',
  },
  {
    title: 'Order with confirmation',
    body: 'Add products to your cart and send your order. You pay nothing on the website. Our team contacts you to confirm the amount, delivery time and payment options before anything ships.',
    href: '/cart', cta: 'Go to your cart',
  },
  {
    title: 'Help choosing a product',
    body: 'Not sure which product fits your routine? Message us with your question. Our team shares usage details from the pack, and for health conditions we recommend speaking to your doctor.',
    href: '/contact', cta: 'Ask a question',
  },
  {
    title: 'Quality and manufacturing',
    body: 'Products are manufactured by Shri Amrit Herbals in a GMP certified facility in Jaipur and marketed by Shri Jaya Ayur Neuro Private Limited. The company is ISO 9001:2015 and MSME registered.',
    href: '/about', cta: 'About us',
  },
  {
    title: 'Business opportunity',
    body: 'Join our member network by invitation from an existing member and share products with people you know. Earnings depend on individual effort and are not guaranteed.',
    href: '/join', cta: 'How joining works',
  },
  {
    title: 'Shipping and returns',
    body: 'Read how we dispatch orders, how long delivery takes and how returns and cancellations work.',
    href: '/shipping-policy', cta: 'Shipping policy',
  },
] as const;
