import { SITE } from './site-config';

export type Faq = { q: string; a: string };

// Plain answers shared by the home page teaser and the /faq page (and its structured data).
export const FAQS: Faq[] = [
  { q: 'How do I place an order?', a: 'Add products to your cart, then send your order from the cart page with your name, phone number and delivery address. Our team contacts you to confirm it.' },
  { q: 'Do I pay when I place the order?', a: 'No. Nothing is charged on this website. Our team confirms the final amount, delivery time and payment options with you before anything ships.' },
  { q: 'How long does delivery take?', a: `Orders are usually dispatched in ${SITE.policy.dispatchDays} and delivered in ${SITE.policy.deliveryDays}, depending on your location.` },
  { q: 'Can I return a product?', a: `Yes, within ${SITE.policy.returnWindowDays} days of delivery for unopened products, and at any time if an item arrives damaged or is not what you ordered. The refund and cancellation policy has the details.` },
  { q: 'How do I use a product?', a: 'Each product page lists directions for use. If you are pregnant, nursing, on medication or have a medical condition, talk to a qualified practitioner first.' },
  { q: 'How do I join the business?', a: 'Joining is by invitation from an existing member. If you have been invited, use the business page and enter their referral code.' },
  { q: 'Are earnings from the business guaranteed?', a: 'No. Income depends on individual effort and is not guaranteed. Please read the income disclaimer before you decide.' },
  { q: 'How can I contact you?', a: 'Use the contact page to send a message. We reply to every message.' },
];
