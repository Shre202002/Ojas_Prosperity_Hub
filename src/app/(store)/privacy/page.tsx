import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero, PolicyBody } from '@/components/store/PageParts';
import { BRAND } from '@/lib/brand';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Privacy policy', description: `How ${BRAND.legalName} collects, uses and protects your personal data.`, alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Privacy policy" intro="What we collect, why we collect it, and the choices you have." />
      <PolicyBody updated={SITE.policy.lastUpdated}>
        <p>This policy explains how {BRAND.legalName} (“we”, “us”) handles your personal data when you use this website, place an order enquiry, contact us or become a member. We follow the Digital Personal Data Protection Act, 2023 and other applicable Indian law.</p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Order enquiries:</strong> name, phone number, email (optional), delivery address, city, pincode, notes and the items you ordered.</li>
          <li><strong>Contact messages:</strong> name, email, phone (optional) and your message.</li>
          <li><strong>Member accounts:</strong> name, email, phone, password (stored only as a salted hash), referral and network details, wallet and payout details such as a UPI ID, and identity documents you upload for KYC verification.</li>
          <li><strong>Payments for membership:</strong> handled by our payment provider, Razorpay. We receive the payment status and reference, not your card or bank credentials.</li>
          <li><strong>Technical data:</strong> a hashed form of your IP address, used only to limit abuse of our forms.</li>
        </ul>

        <h2>Why we use it</h2>
        <ul>
          <li>To confirm and deliver your orders, and to answer your messages.</li>
          <li>To create and run member accounts, pay commissions, and meet legal and tax obligations.</li>
          <li>To verify identity (KYC) before payouts.</li>
          <li>To protect the website and our members from fraud and abuse.</li>
        </ul>
        <p>We do not sell your personal data, and we do not send marketing messages unless you have asked for them.</p>

        <h2>Who we share it with</h2>
        <p>Only with service providers who need it to serve you: delivery partners (name, phone and address), our payment provider, our email and hosting providers, and our image storage provider for KYC documents. We also share data when the law requires it.</p>

        <h2>Cookies and local storage</h2>
        <p>We do not use advertising cookies. Your browser stores your cart and, if you sign in, your session token, so the site can work. Clearing your browser data removes them.</p>

        <h2>How long we keep it</h2>
        <p>We keep order and account records for as long as needed to serve you and to meet accounting, tax and legal requirements. Contact messages are kept until your query is resolved and for a reasonable period afterwards.</p>

        <h2>How we protect it</h2>
        <p>Passwords are hashed, connections use HTTPS, access to member and order data is restricted to authorised staff, and administrator actions require a separate sign-in. No system is perfectly secure, so we also limit what we collect.</p>

        <h2>Your rights</h2>
        <p>You can ask us to show you the personal data we hold, correct it, erase it where the law allows, or withdraw consent you gave. To do this, <Link href="/contact">contact us</Link>{SITE.email ? <> or write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a></> : null}. We will respond within a reasonable time. If you are not satisfied you may complain to the Data Protection Board of India.</p>

        <h2>Children</h2>
        <p>Our website and business opportunity are for adults. We do not knowingly collect data from children.</p>

        <h2>Changes to this policy</h2>
        <p>If we change this policy we will update the date at the top of this page.</p>

        <h2>Contact</h2>
        <p>{BRAND.legalName}{SITE.address ? `, ${SITE.address}` : ''}. Use the <Link href="/contact">contact page</Link> for any privacy question or grievance.</p>
      </PolicyBody>
    </>
  );
}
