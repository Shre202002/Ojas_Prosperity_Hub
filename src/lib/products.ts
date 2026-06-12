export interface Product {
  id: string; // We'll use the slug as the ID for routing
  name: string;
  category: string;
  tag: string;
  price: string;
  currency: string;
  rating: number;
  reviews: number;
  packSize: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  features: string[];
  usage: string;
  ingredients: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: "ojas-veer-shakti",
    name: "Ojas Veer Shakti",
    category: "Men's Wellness",
    tag: "Best Seller",
    price: "₹899",
    currency: "INR",
    rating: 4.8,
    reviews: 128,
    packSize: "500ml",
    shortDescription: "Ayurvedic vitality tonic crafted to support men's wellness, stamina, and daily vitality.",
    description: "Ojas Veer Shakti is a premium Ayurvedic vitality tonic formulated with carefully selected herbal ingredients to support men's overall wellness, energy, stamina, and active lifestyle.",
    benefits: [
      "Supports overall vitality and wellness",
      "Helps maintain daily energy levels",
      "Supports physical strength and stamina",
      "Promotes an active lifestyle",
      "Made from herbal ingredients",
      "Suitable for daily wellness routines"
    ],
    features: [
      "100% Herbal Formula",
      "Ayurvedic Wellness Tonic",
      "No Artificial Preservatives",
      "Easy Liquid Formulation",
      "Daily Use Product"
    ],
    usage: "Take 15ml twice daily with warm milk or lukewarm water.",
    ingredients: [
      "Ayurvedic Herbal Blend",
      "Natural Plant Extracts"
    ]
  },
  {
    id: "ojas-nari-shakti",
    name: "Ojas Nari Shakti",
    category: "Women's Wellness",
    tag: "Women Care",
    price: "₹899",
    currency: "INR",
    rating: 4.7,
    reviews: 96,
    packSize: "500ml",
    shortDescription: "Women's wellness tonic designed to support energy, vitality, and overall health.",
    description: "Ojas Nari Shakti is a specially crafted Ayurvedic wellness tonic designed to support women's overall health, vitality, and wellness.",
    benefits: [
      "Supports women's wellness",
      "Helps maintain daily energy",
      "Supports overall vitality",
      "Supports hormonal wellness",
      "Supports reproductive wellness",
      "Suitable for regular use"
    ],
    features: [
      "Women-Specific Ayurvedic Formula",
      "Traditional Herbal Ingredients",
      "Daily Wellness Support",
      "Easy Liquid Form"
    ],
    usage: "Take 15ml twice daily with fresh water.",
    ingredients: [
      "Ayurvedic Herbal Blend",
      "Natural Plant Extracts"
    ]
  },
  {
    id: "ojas-sea-thorn",
    name: "Ojas Sea Thorn",
    category: "Nutrition & Immunity",
    tag: "Daily Nutrition",
    price: "₹899",
    currency: "INR",
    rating: 4.9,
    reviews: 142,
    packSize: "500ml",
    shortDescription: "Nutritional supplement rich in antioxidants, vitamins, and omega fatty acids.",
    description: "Ojas Sea Thorn is a nutritional wellness supplement enriched with Sea Buckthorn, a natural source of vitamins, antioxidants, and essential fatty acids.",
    benefits: [
      "Rich in antioxidants",
      "Supports immune health",
      "Supports skin wellness",
      "Supports hair wellness",
      "Contains Omega 3, 6, 7 & 9",
      "Suitable for men and women"
    ],
    features: [
      "Sea Buckthorn Based Formula",
      "Rich in Vitamins A, C & E",
      "Natural Antioxidants",
      "Omega Fatty Acids"
    ],
    usage: "Take 15ml twice daily with water.",
    ingredients: [
      "Sea Buckthorn Extract",
      "Natural Herbal Ingredients"
    ]
  },
  {
    id: "ojas-liver-amrit",
    name: "Ojas Liver Amrit",
    category: "Digestive & Liver Wellness",
    tag: "Liver Care",
    price: "₹899",
    currency: "INR",
    rating: 4.8,
    reviews: 85,
    packSize: "500ml",
    shortDescription: "Herbal wellness tonic formulated to support digestive and liver health.",
    description: "Ojas Liver Amrit is an Ayurvedic herbal wellness tonic formulated to support digestive wellness and overall health.",
    benefits: [
      "Supports digestive wellness",
      "Supports liver health maintenance",
      "Supports overall wellness",
      "Supports natural body functions",
      "Herbal nutritional support",
      "Suitable for daily use"
    ],
    features: [
      "Traditional Ayurvedic Formula",
      "Herbal Wellness Support",
      "Easy Liquid Formulation",
      "Daily Health Supplement"
    ],
    usage: "Take 15ml twice daily with fresh water.",
    ingredients: [
      "Ayurvedic Herbal Blend",
      "Natural Plant Extracts"
    ]
  }
];
