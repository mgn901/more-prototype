import { FastifyInstance } from 'fastify';
import { Daos } from '../dao';
import { Product } from '../dao/productsDao';
import { SaleData } from '../dao/ledgerDao';
import { calculateBalance, DENOMINATIONS } from '../utils.js';

// This function should be moved to a shared utility file
const calculateChange = (drawerBalance: any, changeDue: number) => {
  const denominations = [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1].sort((a, b) => b - a);
  let remaining = changeDue;
  const changeToGive: { [key: number]: number } = {};

  for (const denom of denominations) {
    const countNeeded = Math.floor(remaining / denom);
    const countAvailable = drawerBalance[denom] || 0;
    const countToUse = Math.min(countNeeded, countAvailable);

    if (countToUse > 0) {
      changeToGive[denom] = countToUse;
      remaining -= countToUse * denom;
    }
  }

  if (remaining > 0) {
    throw new Error('Insufficient change in drawer.');
  }
  return changeToGive;
};

export const registerSalesRoutes = (fastify: FastifyInstance, daos: Daos) => {

  fastify.post('/api/instances/:instanceId/sales', async (request, reply) => {
    const { instanceId } = request.params as { instanceId: string };
    const { cart, paidAmount } = request.body as { cart: Product[], paidAmount: { [key: number]: number } };

    try {
      const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
      const totalPaid = Object.entries(paidAmount).reduce((sum, [denom, count]) => sum + (parseInt(denom) * count), 0);
      const changeDue = totalPaid - totalPrice;

      if (changeDue < 0) {
        return reply.code(400).send({ error: 'Payment amount is less than total price.' });
      }

      // This is a simplified balance check. The full logic is in drawer.ts and should be centralized.
      const ledgerEntries = await daos.ledger.listLedgerEntriesByPosInstance(instanceId);
      // Simplified balance calculation for this route
      const drawerBalance = calculateBalance(ledgerEntries, DENOMINATIONS)
      for (const [denom, count] of Object.entries(paidAmount)) {
        drawerBalance[parseInt(denom)] = (drawerBalance[parseInt(denom)] || 0) + count;
      }

      const changeGiven = calculateChange(drawerBalance, changeDue);

      const saleData: SaleData = {
        products: cart.map(p => p.id),
        totalPrice,
        paidAmount,
        changeGiven,
      };
      await daos.ledger.createLedgerEntry(instanceId, 'sale', saleData);

      reply.code(201).send({ changeGiven });

    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message || 'Failed to process sale.' });
    }
  });

};
