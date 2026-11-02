import { PageSkeleton, ProductGridSkeleton } from '@/components/store/Skeletons';

export default function Loading() {
  return <PageSkeleton><ProductGridSkeleton count={8} /></PageSkeleton>;
}
