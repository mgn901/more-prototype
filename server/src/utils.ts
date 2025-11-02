import { LedgerEntry } from "./dao/ledgerDao.js"

export const DENOMINATIONS = [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1];

export const calculateBalance = <D extends readonly number[]>(entries: readonly LedgerEntry[], denominations: D): { [K in D[number]]: number } => {
  const balance: { [key: number]: number } = {};
  denominations.forEach(d => balance[d] = 0);
  const entryMap = new Map(entries.map(e => [e.id, e]));

  for (const entry of entries) {
    switch (entry.entry_type) {
      case 'deposit':
        for (const [denom, count] of Object.entries(entry.data.amount)) {
          balance[parseInt(denom)] += count;
        }
        break;
      case 'withdrawal':
        for (const [denom, count] of Object.entries(entry.data.amount)) {
          balance[parseInt(denom)] -= count;
        }
        break;
      case 'sale':
        for (const [denom, count] of Object.entries(entry.data.paidAmount)) {
          balance[parseInt(denom)] += count;
        }
        for (const [denom, count] of Object.entries(entry.data.changeGiven)) {
          balance[parseInt(denom)] -= count;
        }
        break;
      case 'reversal':
        const originalEntry = entryMap.get(entry.data.original_entry_id);
        if (!originalEntry) continue;

        switch (originalEntry.entry_type) {
          case 'deposit':
            for (const [denom, count] of Object.entries(originalEntry.data.amount)) {
              balance[parseInt(denom)] -= count;
            }
            break;
          case 'withdrawal':
            for (const [denom, count] of Object.entries(originalEntry.data.amount)) {
              balance[parseInt(denom)] += count;
            }
            break;
          case 'sale':
            for (const [denom, count] of Object.entries(originalEntry.data.paidAmount)) {
              balance[parseInt(denom)] -= count;
            }
            for (const [denom, count] of Object.entries(originalEntry.data.changeGiven)) {
              balance[parseInt(denom)] += count;
            }
            break;
        }
        break;
    }
  }
  return balance as { [K in D[number]]: number };
}
