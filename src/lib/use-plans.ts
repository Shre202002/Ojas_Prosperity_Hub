'use client';

import { useEffect, useState } from 'react';
import type { PackageView } from '@/lib/package-config';

/** Active BV plans (price already computed from the live BV rate). */
export function usePlans() {
  const [plans, setPlans] = useState<PackageView[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    fetch('/api/packages', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (live) setPlans(Array.isArray(j.data) ? j.data : []); })
      .catch(() => {})
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);
  return { plans, loading };
}
