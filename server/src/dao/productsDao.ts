import { DatabaseExecutor } from '../db';

export type Product = {
  id: number;
  pos_instance_id: string;
  name: string;
  price: number;
  seller_name: string | null;
  version: number;
  display_order: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export const createProductsDao = (db: DatabaseExecutor) => {
  const listProductsByPosInstance = async (posInstanceId: string): Promise<Product[]> => {
    const query = 'SELECT * FROM products WHERE pos_instance_id = ? AND is_deleted = FALSE ORDER BY display_order ASC, name ASC';
    return db.exec(query, [posInstanceId]);
  };

  const createProduct = async (posInstanceId: string, name: string, price: number, sellerName: string | null): Promise<Product> => {
    const insertQuery = 'INSERT INTO products (pos_instance_id, name, price, seller_name) VALUES (?, ?, ?, ?)';
    const selectQuery = 'SELECT * FROM products WHERE id = last_insert_rowid()'; // Specific to SQLite
    // Note: PostgreSQL would use RETURNING id and then a SELECT, or just RETURNING *

    await db.exec(insertQuery, [posInstanceId, name, price, sellerName]);
    const newProduct = await db.exec(selectQuery, []);
    return newProduct[0];
  };

  const updateProduct = async (productId: number, name: string, price: number, sellerName: string | null): Promise<Product | null> => {
    const query = 'UPDATE products SET name = ?, price = ?, seller_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.exec(query, [name, price, sellerName, productId]);
    const selectQuery = 'SELECT * FROM products WHERE id = ?';
    const updated = await db.exec(selectQuery, [productId]);
    return updated[0] || null;
  };

  const deleteProduct = async (productId: number): Promise<void> => {
    const query = 'UPDATE products SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.exec(query, [productId]);
  };

  return {
    listProductsByPosInstance,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
