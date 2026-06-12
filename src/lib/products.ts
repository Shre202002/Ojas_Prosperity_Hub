export interface Product {
  id: string;
  name: string;
  tag: string;
  shortDesc: string;
  fullDesc: string;
  price: string;
  benefits: string[];
  howToUse: string;
  ingredients: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: 'product-veershakti',
    name: 'Ojas Veer Shakti',
    tag: 'Best Seller',
    shortDesc: 'Ayurvedic Vitality Tonic for Men',
    fullDesc: 'Ojas Veer Shakti is a premium Ayurvedic formulation specifically designed to enhance male vitality, stamina, and overall wellness. Crafted with potent traditional herbs, it helps in restoring energy levels and maintaining optimal physical performance.',
    price: '₹899',
    benefits: [
      'Boosts physical stamina and endurance',
      'Enhances energy levels and vitality',
      'Supports natural hormonal balance',
      'Reduces fatigue and stress'
    ],
    howToUse: 'Take 10-15ml twice a day with water or as directed by a healthcare professional.',
    ingredients: ['Ashwagandha', 'Shilajit', 'Safed Musli', 'Gokshura']
  },
  {
    id: 'product-narishakti',
    name: 'Ojas Nari Shakti',
    tag: 'Women Care',
    shortDesc: "Women's Wellness & Vitality Tonic",
    fullDesc: 'Ojas Nari Shakti is a holistic health tonic for women of all ages. It addresses unique nutritional needs, supports hormonal balance, and promotes radiant skin and hair health from within.',
    price: '₹899',
    benefits: [
      'Supports female reproductive health',
      'Maintains natural hormonal balance',
      'Improves energy and reduces anemia risk',
      'Promotes healthy skin and hair'
    ],
    howToUse: 'Take 10-15ml twice a day with water after meals.',
    ingredients: ['Shatavari', 'Ashoka', 'Lodhra', 'Dashmool']
  },
  {
    id: 'product-seathorn',
    name: 'Ojas Sea Thorn',
    tag: 'Daily Nutrition',
    shortDesc: 'Herbal Nutritional Supplement',
    fullDesc: 'Sea Buckthorn (Ojas Sea Thorn) is a powerhouse of nutrients, containing over 190 bioactive compounds. It is exceptionally rich in Vitamin C, Omega fatty acids, and antioxidants, making it an essential daily supplement for modern lifestyle.',
    price: '₹899',
    benefits: [
      'Rich source of Omega 3, 6, 7, and 9',
      'Powerful antioxidant support',
      'Boosts natural immunity',
      'Supports cardiovascular health'
    ],
    howToUse: 'Mix 15ml in a glass of water and consume on an empty stomach in the morning.',
    ingredients: ['Sea Buckthorn Berry Extract', 'Vitamin E']
  },
  {
    id: 'product-liveramrit',
    name: 'Ojas Liver Amrit',
    tag: 'Liver Care',
    shortDesc: 'Herbal Liver Detox & Wellness Tonic',
    fullDesc: 'Ojas Liver Amrit is formulated to protect and rejuvenate the liver. It aids in detoxification, improves digestion, and protects liver cells from damage caused by toxins and unhealthy dietary habits.',
    price: '₹899',
    benefits: [
      'Promotes liver detoxification',
      'Improves digestion and appetite',
      'Protects liver against environmental toxins',
      'Supports healthy metabolism'
    ],
    howToUse: 'Take 10ml twice a day before meals.',
    ingredients: ['Bhumyamalaki', 'Punarnava', 'Kalmegh', 'Kutki']
  }
];
