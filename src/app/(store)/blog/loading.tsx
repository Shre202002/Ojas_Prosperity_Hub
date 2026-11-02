import { Skeleton } from '@/components/ui/skeleton';
import { PageSkeleton } from '@/components/store/Skeletons';

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="space-y-3"><Skeleton className="aspect-[4/3] w-full" /><Skeleton className="h-5 w-4/5" /><Skeleton className="h-4 w-full" /></div>)}
      </div>
    </PageSkeleton>
  );
}
