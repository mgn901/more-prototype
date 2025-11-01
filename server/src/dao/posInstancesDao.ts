import { DatabaseExecutor } from '../db';
import { randomBytes } from 'crypto';

export type PosInstance = {
  id: string;
  created_at: string;
};

export const createPosInstancesDao = (db: DatabaseExecutor) => {
  const createPosInstance = async (): Promise<PosInstance> => {
    const id = randomBytes(12).toString('hex'); // 96 bits
    const query = 'INSERT INTO pos_instances (id) VALUES (?) RETURNING *';
    const sqliteQuery = 'INSERT INTO pos_instances (id) VALUES (?)';
    const selectQuery = 'SELECT * FROM pos_instances WHERE id = ?';

    try {
      // PostgreSQL supports RETURNING, SQLite does not in this driver version.
      const result = await db.exec(query, [id]);
      if (result.length > 0) {
        return result[0];
      }
    } catch (e) {
      // Assuming error indicates non-PostgreSQL DB
      await db.exec(sqliteQuery, [id]);
      const newInstance = await db.exec(selectQuery, [id]);
      return newInstance[0];
    }
    // Fallback in case of unexpected result
    const newInstance = await db.exec(selectQuery, [id]);
    return newInstance[0];
  };

  const findPosInstanceById = async (id: string): Promise<PosInstance | null> => {
    const query = 'SELECT * FROM pos_instances WHERE id = ?';
    const results = await db.exec(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  return {
    createPosInstance,
    findPosInstanceById,
  };
};
