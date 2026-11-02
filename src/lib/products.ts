// Starter product data. The live storefront reads the `products` collection (Admin > Products);
// this list is only used by scripts/seed-products.mjs to create the first draft, and is never shown on the site by itself.
export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  /** MRP in INR. 0 = not priced yet (kept as an inactive draft until a price is set in Admin). */
  price: number;
  /** Selling price in INR. 0 = not priced yet. */
  salePrice: number;
  stock: number | null;
  sku: string;
  packSize: string;
  image: string;
  gallery: string[];
  shortDescription: string;
  description: string;
  benefits: string[];
  usage: string;
  isFeatured: boolean;
  isBestSeller: boolean;
}

// Details taken from the printed pack. Confirm the wording and ingredients against the approved label before publishing.
export const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "special-15",
    name: "Special 15",
    category: "Herbal Wellness",
    price: 0,
    salePrice: 0,
    stock: null,
    sku: "SPECIAL-15-500",
    packSize: "500ml",
    image: "/assets/products/special-15.webp",
    gallery: ["/assets/products/special-15.webp"],
    shortDescription: "A herbal wellness formulation with the goodness of Noni.",
    description: "Special 15 is a balanced herbal wellness formulation enriched with Noni, combined with traditional Ayurvedic herbs such as Ashwagandha, Giloy, Brahmi and Neem. It is designed to nourish the body naturally and support overall health and vitality.",
    benefits: [
      "Supports healthy energy levels",
      "Supports the immune system",
      "Supports liver function and digestion",
      "Supports mental alertness",
      "Supports overall well-being"
    ],
    usage: "15 to 20 ml twice daily. Shake well before use. Store in a cool, dry place away from direct sunlight and keep out of reach of children.",
    isFeatured: true,
    isBestSeller: false
  }
];
