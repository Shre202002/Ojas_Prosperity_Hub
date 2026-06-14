export interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  salePrice: number;
  currency: string;
  discount: number;
  stock: number;
  sku: string;
  packSize: string;
  image: string;
  gallery: string[];
  rating: number;
  reviews: number;
  shortDescription: string;
  description: string;
  benefits: string[];
  usage: string;
  isFeatured: boolean;
  isBestSeller: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "veer-shakti",
    name: "Ayurvedic Kendra Veer Shakti",
    brand: "Ayurvedic Kendra",
    category: "Men's Wellness",
    price: 1499,
    salePrice: 1199,
    currency: "INR",
    discount: 20,
    stock: 100,
    sku: "AK-VS-500",
    packSize: "500ml",
    image: "/assets/products/veer-shakti.png",
    gallery: [
      "/assets/products/veer-shakti.png"
    ],
    rating: 4.8,
    reviews: 128,
    shortDescription: "Premium Ayurvedic wellness tonic for men's vitality, stamina, and overall wellness.",
    description: "Ayurvedic Kendra Veer Shakti is a carefully crafted herbal wellness tonic designed to support men's active lifestyle, energy levels, and overall well-being.",
    benefits: [
      "Supports strength and stamina",
      "Promotes vitality and wellness",
      "Supports physical performance",
      "Supports daily energy",
      "100% herbal formulation",
      "Suitable for regular use"
    ],
    usage: "Take 15ml twice daily with milk or lukewarm water.",
    isFeatured: true,
    isBestSeller: true
  },
  {
    id: 2,
    slug: "nari-shakti",
    name: "Ayurvedic Kendra Nari Shakti",
    brand: "Ayurvedic Kendra",
    category: "Women's Wellness",
    price: 1499,
    salePrice: 1199,
    currency: "INR",
    discount: 20,
    stock: 100,
    sku: "AK-NS-500",
    packSize: "500ml",
    image: "/assets/products/nari-shakti.png",
    gallery: [
      "/assets/products/nari-shakti.png"
    ],
    rating: 4.9,
    reviews: 96,
    shortDescription: "Herbal wellness tonic formulated to support women's health, vitality, and daily wellness.",
    description: "Ayurvedic Kendra Nari Shakti is an Ayurvedic wellness tonic designed to support women's overall health, vitality, and active lifestyle.",
    benefits: [
      "Supports women's wellness",
      "Supports daily vitality",
      "Supports hormonal wellness",
      "Promotes overall well-being",
      "Supports active lifestyle",
      "Traditional Ayurvedic formulation"
    ],
    usage: "Take 15ml twice daily with water.",
    isFeatured: true,
    isBestSeller: false
  },
  {
    id: 3,
    slug: "sea-thorn",
    name: "Ayurvedic Kendra Sea Thorn",
    brand: "Ayurvedic Kendra",
    category: "Nutrition & Immunity",
    price: 1699,
    salePrice: 1299,
    currency: "INR",
    discount: 24,
    stock: 100,
    sku: "AK-ST-500",
    packSize: "500ml",
    image: "/assets/products/sea-thorn.png",
    gallery: [
      "/assets/products/sea-thorn.png"
    ],
    rating: 4.9,
    reviews: 142,
    shortDescription: "Sea Buckthorn nutritional supplement rich in antioxidants, vitamins, and omega fatty acids.",
    description: "Ayurvedic Kendra Sea Thorn is a premium nutritional wellness supplement enriched with Sea Buckthorn to support immunity, skin health, and overall wellness.",
    benefits: [
      "Rich in antioxidants",
      "Supports immunity",
      "Supports skin wellness",
      "Supports hair wellness",
      "Contains Omega 3, 6, 7 & 9",
      "Suitable for men and women"
    ],
    usage: "Take 15ml twice daily with water.",
    isFeatured: true,
    isBestSeller: true
  },
  {
    id: 4,
    slug: "liver-amrit",
    name: "Ayurvedic Kendra Liver Amrit",
    brand: "Ayurvedic Kendra",
    category: "Digestive & Liver Wellness",
    price: 1599,
    salePrice: 1249,
    currency: "INR",
    discount: 22,
    stock: 100,
    sku: "AK-LA-500",
    packSize: "500ml",
    image: "/assets/products/liver-amrit.png",
    gallery: [
      "/assets/products/liver-amrit.png"
    ],
    rating: 4.8,
    reviews: 85,
    shortDescription: "Herbal wellness tonic designed to support digestive wellness and overall health.",
    description: "Ayurvedic Kendra Liver Amrit is a traditional herbal wellness tonic formulated to support digestive wellness and maintain overall well-being.",
    benefits: [
      "Supports digestive wellness",
      "Supports liver health",
      "Supports overall wellness",
      "Supports natural body functions",
      "Herbal nutritional support",
      "Suitable for daily use"
    ],
    usage: "Take 15ml twice daily with water.",
    isFeatured: false,
    isBestSeller: true
  }
];
