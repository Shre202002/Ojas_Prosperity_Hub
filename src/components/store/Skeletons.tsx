import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-3 sm:p-4" aria-hidden>
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="mt-3 h-3 w-1/2" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-3/4" />
      <Skeleton className="mt-3 h-6 w-1/3" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6" role="status" aria-label="Loading">
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
      {children}
    </div>
  );
}
