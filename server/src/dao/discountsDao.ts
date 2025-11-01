import { DatabaseExecutor } from '../db';

export type DiscountCondition = {
  id: number;
  pos_instance_id: string;
  type: 'quantity_discount' | 'value_discount';
  details: string; // JSON string for products, quantity, discount value/rate
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export const createDiscountsDao = (db: DatabaseExecutor) => {
  const listDiscountsByPosInstance = async (posInstanceId: string): Promise<DiscountCondition[]> => {
    const query = 'SELECT * FROM discount_conditions WHERE pos_instance_id = ? AND is_deleted = FALSE ORDER BY created_at DESC';
    return db.exec(query, [posInstanceId]);
  };

  const createDiscount = async (posInstanceId: string, type: DiscountCondition['type'], details: object): Promise<DiscountCondition> => {
    const detailsJson = JSON.stringify(details);
    const insertQuery = 'INSERT INTO discount_conditions (pos_instance_id, type, details) VALUES (?, ?, ?)';
    const selectQuery = 'SELECT * FROM discount_conditions WHERE id = last_insert_rowid()'; // SQLite specific

    await db.exec(insertQuery, [posInstanceId, type, detailsJson]);
    const newDiscount = await db.exec(selectQuery, []);
    return newDiscount[0];
  };

  const deleteDiscount = async (discountId: number): Promise<void> => {
    const query = 'UPDATE discount_conditions SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.exec(query, [discountId]);
  };

  return {
    listDiscountsByPosInstance,
    createDiscount,
    deleteDiscount,
  };
};
