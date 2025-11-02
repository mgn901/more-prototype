import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MenuBar from '../components/MenuBar';

// From server/src/dao/ledgerDao.ts

// Type definitions for the structured `data` field
export type SaleData = { products: number[]; totalPrice: number; paidAmount: { [key: number]: number }; changeGiven: { [key: number]: number }; };
export type DepositData = { person: string; amount: { [key: number]: number }; };
export type WithdrawalData = { person: string; amount: { [key: number]: number }; };
export type ReversalData = { original_entry_id: number; };
export type LedgerEntryData = SaleData | DepositData | WithdrawalData | ReversalData;

// Raw type from the database
type RawLedgerEntry = {
  id: number;
  pos_instance_id: string;
  entry_type: 'sale' | 'deposit' | 'withdrawal' | 'reversal';
  data: string; // JSON string from DB
  is_reverted: boolean;
  created_at: string;
}

// The fully typed LedgerEntry for use in the application
export type LedgerEntry = Omit<RawLedgerEntry, 'data' | 'entry_type'> & ({
  entry_type: 'sale';
  data: SaleData;
} | {
  entry_type: 'deposit';
  data: DepositData;
} | {
  entry_type: 'withdrawal';
  data: WithdrawalData;
} | {
  entry_type: 'reversal';
  data: ReversalData;
});

const formatAmount = (amountObj: { [key: number]: number }) => {
  const total = Object.entries(amountObj).reduce((sum, [denom, count]) => sum + (parseInt(denom) * count), 0);
  return `¥${total.toLocaleString()}`;
};

const LedgerEntryRow: React.FC<{ entry: LedgerEntry, onRevert: (entryId: number) => void }> = ({ entry, onRevert }) => {
  let description = 'Unknown Entry';

  switch (entry.entry_type) {
    case 'sale':
      description = `売上: ${entry.data.products.length}点, 合計 ¥${entry.data.totalPrice.toLocaleString()}`;
      break;
    case 'deposit':
      description = `入金 (${entry.data.person}): ${formatAmount(entry.data.amount)}`;
      break;
    case 'withdrawal':
      description = `出金 (${entry.data.person}): ${formatAmount(entry.data.amount)}`;
      break;
    case 'reversal':
      description = `[取消] ID:${entry.data.original_entry_id} の操作を取り消し`;
      break;
  }

  const rowClass = entry.is_reverted ? 'opacity-50 text-decoration-line: line-through' : '';

  return (
    <tr className={`border-b border-g0-800 ${rowClass}`}>
      <td className="p-3 text-sm text-g1-400">{new Date(entry.created_at).toLocaleString()}</td>
      <td className="p-3">{description}</td>
      <td className="p-3 text-center">
        {!entry.is_reverted && entry.entry_type !== 'reversal' && (
          <button onClick={() => onRevert(entry.id)} className="text-r8-300 hover:text-r8-200 text-sm">取り消し</button>
        )}
      </td>
    </tr>
  );
};

const LedgerPage: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/instances/${instanceId}/ledger`);
      if (!response.ok) throw new Error('Failed to fetch ledger.');
      setEntries(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleRevertEntry = async (entryId: number) => {
    if (window.confirm(`Are you sure you want to revert entry #${entryId}? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/ledger/${entryId}/revert`, { method: 'POST' });
        if (!response.ok) {
          const res = await response.json();
          throw new Error(res.error || 'Failed to revert entry.');
        }
        fetchLedger(); // Refresh the list
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-g0-1000 text-g0-100 flex flex-col">
      <MenuBar />
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-t4b4-300 mb-6">台帳</h1>
        {error && <p className="bg-r8-800 text-r8-100 p-3 rounded-md mb-6">{error}</p>}
        <div className="bg-g0-900 rounded-lg shadow-lg overflow-hidden">
          {isLoading ? <p className="p-4">Loading ledger...</p> : (
            <table className="w-full">
              <thead className="bg-g0-800">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-g1-300 w-1/4">日時</th>
                  <th className="p-3 text-left text-sm font-semibold text-g1-300 w-1/2">内容</th>
                  <th className="p-3 text-center text-sm font-semibold text-g1-300 w-1/4">操作</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <LedgerEntryRow key={entry.id} entry={entry} onRevert={handleRevertEntry} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LedgerPage;
