import { DatabaseExecutor } from '../db';

export type LedgerEntry = {
  id: number;
  pos_instance_id: string;
  entry_type: 'sale' | 'deposit' | 'withdrawal' | 'reversal';
  data: string; // JSON string
  is_reverted: boolean;
  created_at: string;
};

export const createLedgerDao = (db: DatabaseExecutor) => {
  const listLedgerEntriesByPosInstance = async (posInstanceId: string): Promise<LedgerEntry[]> => {
    const query = 'SELECT * FROM ledger_entries WHERE pos_instance_id = ? ORDER BY created_at DESC';
    return db.exec(query, [posInstanceId]);
  };

  const createLedgerEntry = async (posInstanceId: string, entryType: LedgerEntry['entry_type'], data: object): Promise<LedgerEntry> => {
    const dataJson = JSON.stringify(data);
    const insertQuery = 'INSERT INTO ledger_entries (pos_instance_id, entry_type, data) VALUES (?, ?, ?)';
    const selectQuery = 'SELECT * FROM ledger_entries WHERE id = last_insert_rowid()'; // SQLite specific

    await db.exec(insertQuery, [posInstanceId, entryType, dataJson]);
    const newEntry = await db.exec(selectQuery, []);
    return newEntry[0];
  };

  const revertLedgerEntry = async (entryId: number): Promise<void> => {
    // This should ideally be a transaction.
    const updateQuery = 'UPDATE ledger_entries SET is_reverted = TRUE WHERE id = ?';
    await db.exec(updateQuery, [entryId]);

    // We need the pos_instance_id from the original entry to create the reversal entry
    const selectQuery = 'SELECT pos_instance_id FROM ledger_entries WHERE id = ?';
    const originalEntry = await db.exec(selectQuery, [entryId]);
    if (!originalEntry || originalEntry.length === 0) {
      throw new Error('Original entry not found for reversal.');
    }
    const posInstanceId = originalEntry[0].pos_instance_id;

    const reversalData = { original_entry_id: entryId };
    await createLedgerEntry(posInstanceId, 'reversal', reversalData);
  };

  return {
    listLedgerEntriesByPosInstance,
    createLedgerEntry,
    revertLedgerEntry,
  };
};
