import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero, PolicyBody } from '@/components/store/PageParts';
import { BRAND } from '@/lib/brand';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Disclaimer', description: 'Health and income disclaimers.', alternates: { canonical: '/disclaimer' } };

export default function DisclaimerPage() {
  return (
    <>
      <PageHero title="Disclaimer" intro="Please read this before you use our products or consider the business." />
      <PolicyBody updated={SITE.policy.lastUpdated}>
        <h2>Health and products</h2>
        <ul>
          <li>Our products are not intended to diagnose, treat, cure or prevent any disease.</li>
          <li>Information on this website is for general awareness. It does not replace advice from a qualified doctor or Ayurvedic practitioner.</li>
          <li>If you are pregnant, nursing, taking medication, have a medical condition, or are allergic to any ingredient, talk to a qualified practitioner before using any product.</li>
          <li>Stop using a product and seek medical advice if you notice an unexpected reaction.</li>
          <li>Results differ from person to person. We do not promise any particular result.</li>
          <li>Keep products out of reach of children and store them as directed on the pack.</li>
        </ul>

        <h2>Income from the business</h2>
        <ul>
          <li>Membership in the {BRAND.name} network gives you the chance to earn commissions from product sales. It does not guarantee any income.</li>
          <li>Earnings depend on your own effort, skills, time and market conditions. Some members earn little or nothing.</li>
          <li>Any figure or example shown to you is an illustration only, not a promise or a typical result.</li>
          <li>Do not join because of expected income, and do not pay or borrow money you cannot afford to lose.</li>
          <li>Members are independent. They are not employees of {BRAND.legalName}, and must not make health or income claims that are not in our official material.</li>
        </ul>

        <h2>Website content</h2>
        <p>We work to keep this website accurate, but we do not promise that it is free of errors or always available. Product images are illustrative.</p>

        <h2>Questions</h2>
        <p>If anything here is unclear, <Link href="/contact">contact us</Link> before you order or join.</p>
      </PolicyBody>
    </>
  );
}
