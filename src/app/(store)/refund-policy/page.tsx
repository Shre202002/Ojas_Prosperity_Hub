import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero, PolicyBody } from '@/components/store/PageParts';
import { BRAND } from '@/lib/brand';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Refund and cancellation policy', description: 'How cancellations, returns and refunds work.', alternates: { canonical: '/refund-policy' } };

export default function RefundPolicyPage() {
  const days = SITE.policy.returnWindowDays;
  return (
    <>
      <PageHero title="Refund and cancellation policy" intro="Plain rules for cancelling an order, returning a product and getting your money back." />
      <PolicyBody updated={SITE.policy.lastUpdated}>
        <h2>Cancelling an order</h2>
        <p>You can cancel any time before we dispatch your order. <Link href="/contact">Contact us</Link> with your order reference. If you have already paid, we refund the full amount.</p>

        <h2>Returns</h2>
        <p>You can return a product within {days} days of delivery if it is unopened, unused and in its original packaging. To keep products safe and hygienic, we cannot accept returns of opened or used consumables, unless the product is faulty.</p>

        <h2>Damaged, wrong or faulty items</h2>
        <p>If your order arrives damaged, is not what you ordered, or has a fault, tell us within 48 hours of delivery and include a photo of the product and the packaging. We will replace it or refund you, whichever you prefer, and we cover the return shipping.</p>

        <h2>How to start a return</h2>
        <ol>
          <li><Link href="/contact">Contact us</Link> with your order reference and the reason.</li>
          <li>We confirm whether the return qualifies and tell you how to send the product back.</li>
          <li>We inspect it when it arrives and approve or decline the refund.</li>
        </ol>

        <h2>Refunds</h2>
        <p>Approved refunds go back to the original payment method within 7 to 10 business days of approval. Delivery charges are refunded only when the return is due to our error.</p>

        <h2>Membership payments</h2>
        <p>Membership and joining payments are covered by the member terms shown when you join. Please read them before you pay.</p>

        <h2>Questions</h2>
        <p>If something here is unclear, ask before you order. {BRAND.legalName} will answer through the <Link href="/contact">contact page</Link>.</p>
      </PolicyBody>
    </>
  );
}
