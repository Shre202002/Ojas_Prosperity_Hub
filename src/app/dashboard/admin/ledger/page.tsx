'use client';

import { WalletTransactionsTable } from '@/components/wallet/WalletTransactionsTable';

export default function AdminTransactionLedgerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Transaction Ledger</h1>
        <p className="mt-2 text-muted-foreground">Every purchase, commission, conversion and withdrawal across all members.</p>
      </div>
      <WalletTransactionsTable endpoint="/api/admin/wallet-transactions" admin />
    </div>
  );
}
