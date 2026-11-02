import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero, PolicyBody } from '@/components/store/PageParts';
import { BRAND } from '@/lib/brand';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Terms of service', description: `Terms for using the ${BRAND.name} website and placing orders.`, alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <>
      <PageHero title="Terms of service" intro="The rules for using this website and ordering from us." />
      <PolicyBody updated={SITE.policy.lastUpdated}>
        <p>By using this website or sending an order enquiry you agree to these terms. If you do not agree, please do not use the website.</p>

        <h2>About us</h2>
        <p>This website is operated by {BRAND.legalName}{SITE.address ? `, ${SITE.address}` : ''}{SITE.gstin ? `. GSTIN ${SITE.gstin}` : ''}.</p>

        <h2>Using the website</h2>
        <ul>
          <li>You must be 18 or older to place an order or join the business.</li>
          <li>Give accurate information, and do not misuse the website, attempt to access other people’s data, or interfere with how it works.</li>
          <li>You are responsible for keeping your account password private.</li>
        </ul>

        <h2>Products and information</h2>
        <p>We describe our products as accurately as we can. Product information is for general awareness and is not medical advice. See the <Link href="/disclaimer">disclaimer</Link>. Images are for illustration; packaging may vary slightly.</p>

        <h2>Prices</h2>
        <p>Prices are in Indian rupees and include applicable taxes unless we say otherwise. Delivery charges, if any, are confirmed before you pay. We may change prices at any time, and we may correct a price shown in error before confirming your order.</p>

        <h2>How an order works</h2>
        <ol>
          <li>You send an order enquiry from your cart. This is a request, not a purchase, and nothing is charged.</li>
          <li>We contact you to confirm the items, the final amount, delivery charges and payment method.</li>
          <li>A binding order exists only after we confirm it and you agree to the amount. We may decline or cancel an order if a product is unavailable, the details are incomplete, or we suspect misuse.</li>
        </ol>

        <h2>Delivery, returns and refunds</h2>
        <p>These are covered in the <Link href="/shipping-policy">shipping policy</Link> and the <Link href="/refund-policy">refund and cancellation policy</Link>, which form part of these terms.</p>

        <h2>The business opportunity</h2>
        <p>Becoming a member is a separate arrangement that is open by invitation. Membership is governed by the member terms shown when you join, and by the <Link href="/disclaimer">income disclaimer</Link>. Nothing on this website is a promise of income.</p>

        <h2>Intellectual property</h2>
        <p>The website, text, logos, images and product names belong to {BRAND.legalName} or its licensors. You may not copy or reuse them without our written permission.</p>

        <h2>Limits on our responsibility</h2>
        <p>To the extent the law allows, we are not liable for indirect or consequential loss arising from use of the website, or for delays caused by events outside our control. Nothing in these terms limits any right you have under consumer protection law.</p>

        <h2>Governing law</h2>
        <p>These terms are governed by the laws of India. Courts at the location of our registered office have jurisdiction, subject to any right you have to approach a consumer forum.</p>

        <h2>Changes</h2>
        <p>We may update these terms. The date at the top shows when they last changed. Continued use after a change means you accept it.</p>

        <h2>Contact</h2>
        <p>Questions about these terms? <Link href="/contact">Contact us</Link>.</p>
      </PolicyBody>
    </>
  );
}
