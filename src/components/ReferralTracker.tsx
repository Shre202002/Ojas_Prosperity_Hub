'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * ReferralTracker - Captures 'ref' query parameter from the URL
 * and persists it in localStorage so it stays active even if the user
 * navigates away from the landing page.
 */
function TrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.length >= 5) {
      // Store the sponsor ID for the entire session/return visits
      localStorage.setItem('sponsorId', ref);
      console.log('Referral code captured and persisted:', ref);
    }
  }, [searchParams]);

  return null;
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
