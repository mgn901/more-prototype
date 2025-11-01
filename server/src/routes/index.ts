import { FastifyInstance } from 'fastify';
import { Daos } from '../dao';
import { registerPosInstancesRoutes } from './posInstances';
import { registerProductsRoutes } from './products';
import { registerLedgerRoutes } from './ledger';
import { registerSalesRoutes } from './sales';
import { registerDiscountsRoutes } from './discounts';

export const registerRoutes = (fastify: FastifyInstance, daos: Daos) => {
  registerPosInstancesRoutes(fastify, daos);
  registerProductsRoutes(fastify, daos);
  registerLedgerRoutes(fastify, daos);
  registerSalesRoutes(fastify, daos);
  registerDiscountsRoutes(fastify, daos);
};
