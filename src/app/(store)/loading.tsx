import { Skeleton } from '@/components/ui/skeleton';
import { ProductGridSkeleton } from '@/components/store/Skeletons';

// Shown instantly while a storefront page streams in (home page: hero block, then product row).
export default function Loading() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-[60svh] min-h-[360px] w-full rounded-none" />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
