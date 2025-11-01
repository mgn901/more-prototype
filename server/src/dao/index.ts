import { createDatabase, DatabaseExecutor } from '../db';
import { createPosInstancesDao } from './posInstancesDao';
import { createProductsDao } from './productsDao';
import { createLedgerDao } from './ledgerDao';
import { createDiscountsDao } from './discountsDao';

// Define the shape of all DAOs
export type Daos = {
  posInstances: ReturnType<typeof createPosInstancesDao>;
  products: ReturnType<typeof createProductsDao>;
  ledger: ReturnType<typeof createLedgerDao>;
  discounts: ReturnType<typeof createDiscountsDao>;
  // other daos will be added here
};

// Factory function to create all DAOs
export const createDaos = async (): Promise<Daos> => {
  const db = await createDatabase();

  const daos: Daos = {
    posInstances: createPosInstancesDao(db),
    products: createProductsDao(db),
    ledger: createLedgerDao(db),
    discounts: createDiscountsDao(db),
  };

  return daos;
};
