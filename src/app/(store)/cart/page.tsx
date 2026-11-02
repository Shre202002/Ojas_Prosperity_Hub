import type { Metadata } from 'next';
import { CartView } from '@/components/store/CartView';
import { Container, PageHero } from '@/components/store/PageParts';

export const metadata: Metadata = { title: 'Your cart', robots: { index: false, follow: false } };

export default function CartPage() {
  return (
    <>
      <PageHero title="Your cart" />
      <Container><CartView /></Container>
    </>
  );
}
