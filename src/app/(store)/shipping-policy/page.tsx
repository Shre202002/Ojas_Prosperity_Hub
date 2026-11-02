import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero, PolicyBody } from '@/components/store/PageParts';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Shipping policy', description: 'Dispatch times, delivery times and charges.', alternates: { canonical: '/shipping-policy' } };

export default function ShippingPolicyPage() {
  return (
    <>
      <PageHero title="Shipping policy" intro="When your order ships, how long it takes, and what it costs." />
      <PolicyBody updated={SITE.policy.lastUpdated}>
        <h2>Where we deliver</h2>
        <p>We deliver across India to pincodes our courier partners serve. If we cannot deliver to your pincode, we will tell you when we confirm your order.</p>

        <h2>Dispatch and delivery time</h2>
        <ul>
          <li><strong>Dispatch:</strong> usually within {SITE.policy.dispatchDays} of your order being confirmed.</li>
          <li><strong>Delivery:</strong> usually {SITE.policy.deliveryDays} after dispatch, depending on your location.</li>
        </ul>
        <p>These are estimates. Weather, festivals and courier delays can add time.</p>

        <h2>Delivery charges</h2>
        <p>Any delivery charge is told to you when we confirm your order, before you pay. Prices on the website do not include delivery unless stated.</p>

        <h2>Tracking</h2>
        <p>When your order ships we share the courier name and tracking number by phone, WhatsApp or email.</p>

        <h2>Your address</h2>
        <p>Please give a complete address with a correct pincode and a phone number the courier can reach. If an order is returned to us because of an incorrect address or because nobody was available, we may ask you to cover the cost of sending it again.</p>

        <h2>Damaged in transit</h2>
        <p>If a package looks damaged when it arrives, please record a short video while opening it and <Link href="/contact">contact us</Link> within 48 hours. See the <Link href="/refund-policy">refund and cancellation policy</Link>.</p>
      </PolicyBody>
    </>
  );
}
