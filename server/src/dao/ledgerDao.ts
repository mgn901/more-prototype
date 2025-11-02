import { DatabaseExecutor } from '../db';

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
};

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


// Helper to parse a raw entry
const parseEntry = (raw: RawLedgerEntry): LedgerEntry => ({
  ...raw,
  data: JSON.parse(raw.data),
});

export const createLedgerDao = (db: DatabaseExecutor) => {
  const listLedgerEntriesByPosInstance = async (posInstanceId: string): Promise<LedgerEntry[]> => {
    const query = 'SELECT * FROM ledger_entries WHERE pos_instance_id = ? ORDER BY created_at DESC';
    const rawEntries: RawLedgerEntry[] = await db.exec(query, [posInstanceId]);
    return rawEntries.map(parseEntry);
  };

  const createLedgerEntry = async (posInstanceId: string, entryType: LedgerEntry['entry_type'], data: LedgerEntryData): Promise<LedgerEntry> => {
    const dataJson = JSON.stringify(data);
    const insertQuery = 'INSERT INTO ledger_entries (pos_instance_id, entry_type, data) VALUES (?, ?, ?)';
    const selectQuery = 'SELECT * FROM ledger_entries WHERE id = last_insert_rowid()'; // SQLite specific

    await db.exec(insertQuery, [posInstanceId, entryType, dataJson]);
    const newRawEntry: RawLedgerEntry[] = await db.exec(selectQuery, []);
    return parseEntry(newRawEntry[0]);
  };

  const revertLedgerEntry = async (entryId: number): Promise<void> => {
    // This should ideally be a transaction.
    const updateQuery = 'UPDATE ledger_entries SET is_reverted = TRUE WHERE id = ?';
    await db.exec(updateQuery, [entryId]);

    const selectQuery = 'SELECT pos_instance_id FROM ledger_entries WHERE id = ?';
    const originalEntry: {pos_instance_id: string}[] = await db.exec(selectQuery, [entryId]);
    if (!originalEntry || originalEntry.length === 0) {
      throw new Error('Original entry not found for reversal.');
    }
    const posInstanceId = originalEntry[0].pos_instance_id;

    await createLedgerEntry(posInstanceId, 'reversal', { original_entry_id: entryId });
  };

  return {
    listLedgerEntriesByPosInstance,
    createLedgerEntry,
    revertLedgerEntry,
  };
};
