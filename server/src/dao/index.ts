import { createDatabase, DatabaseExecutor } from '../db';
import { createPosInstancesDao } from './posInstancesDao';

// Define the shape of all DAOs
export type Daos = {
  posInstances: ReturnType<typeof createPosInstancesDao>;
  // other daos will be added here
};

// Factory function to create all DAOs
export const createDaos = async (): Promise<Daos> => {
  const db = await createDatabase();

  const daos: Daos = {
    posInstances: createPosInstancesDao(db),
  };

  return daos;
};
