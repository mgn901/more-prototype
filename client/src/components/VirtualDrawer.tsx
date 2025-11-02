import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';

const denominations = [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1];

type LedgerEntry = {
  id: number;
  entry_type: 'sale' | 'deposit' | 'withdrawal' | 'reversal';
  data: string; // JSON string
  is_reverted: boolean;
};

const VirtualDrawer: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [balance, setBalance] = useState<{[key: number]: number}>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const calculateBalance = useCallback((entries: LedgerEntry[]) => {
    const newBalance = denominations.reduce((acc, denom) => ({ ...acc, [denom]: 0 }), {});
    const entryMap = new Map(entries.map(e => [e.id, e]));

    for (const entry of entries) {
        if (entry.is_reverted) continue;

        try {
            const data = JSON.parse(entry.data);

            if (entry.entry_type === 'deposit') {
                for (const [denom, count] of Object.entries(data.amount || {})) {
                    newBalance[parseInt(denom)] += count as number;
                }
            } else if (entry.entry_type === 'withdrawal') {
                for (const [denom, count] of Object.entries(data.amount || {})) {
                    newBalance[parseInt(denom)] -= count as number;
                }
            } else if (entry.entry_type === 'sale') {
                if (data.paidAmount) {
                    for (const [denom, count] of Object.entries(data.paidAmount)) {
                        newBalance[parseInt(denom)] += count as number;
                    }
                }
                if (data.changeGiven) {
                    for (const [denom, count] of Object.entries(data.changeGiven)) {
                        newBalance[parseInt(denom)] -= count as number;
                    }
                }
            } else if (entry.entry_type === 'reversal') {
                const originalEntry = entryMap.get(data.original_entry_id);
                if (originalEntry) {
                    const originalData = JSON.parse(originalEntry.data);
                    if (originalEntry.entry_type === 'deposit') {
                        for (const [denom, count] of Object.entries(originalData.amount || {})) {
                            newBalance[parseInt(denom)] -= count as number;
                        }
                    } else if (originalEntry.entry_type === 'withdrawal') {
                        for (const [denom, count] of Object.entries(originalData.amount || {})) {
                            newBalance[parseInt(denom)] += count as number;
                        }
                    } else if (originalEntry.entry_type === 'sale') {
                        if (originalData.paidAmount) {
                            for (const [denom, count] of Object.entries(originalData.paidAmount)) {
                                newBalance[parseInt(denom)] -= count as number;
                            }
                        }
                        if (originalData.changeGiven) {
                            for (const [denom, count] of Object.entries(originalData.changeGiven)) {
                                newBalance[parseInt(denom)] += count as number;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to parse ledger entry data', e);
        }
    }
    
    const grandTotal = Object.entries(newBalance).reduce((sum, [denom, count]) => sum + (parseInt(denom) * count), 0);
    setBalance(newBalance);
    setTotal(grandTotal);
  }, []);

  useEffect(() => {
    const fetchLedger = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/instances/${instanceId}/ledger`);
        if (!response.ok) throw new Error('Failed to fetch ledger data.');
        const entries: LedgerEntry[] = await response.json();
        calculateBalance(entries);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLedger();
  }, [instanceId, calculateBalance]);

  return (
    <div className="bg-g0-800 p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">仮想ドロワ</h2>
      {isLoading ? <p>Loading...</p> : (
        <div className="flex-grow space-y-2 overflow-y-auto">
          {denominations.map(denom => (
            <div key={denom} className="flex justify-between items-center text-sm">
              <span className="text-g1-300">{denom.toLocaleString()}円 x</span>
              <span className="font-mono text-lg">{balance[denom] || 0}</span>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-g1-600 pt-4 mt-4">
          <div className="flex justify-between items-center font-bold text-xl">
            <span>合計:</span>
            <span>¥{total.toLocaleString()}</span>
          </div>
      </div>
      <Link 
        to={`/${instanceId}/drawer`} 
        className="mt-4 bg-t5b3-500 hover:bg-t5b3-400 text-g0-1000 font-bold rounded py-2 px-4 text-center transition-colors"
      >
        入出金
      </Link>
    </div>
  );
};

export default VirtualDrawer;
