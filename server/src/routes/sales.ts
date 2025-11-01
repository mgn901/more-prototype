import { FastifyInstance } from 'fastify';
import { Daos } from '../dao';
import { Product } from '../dao/productsDao';
import { LedgerEntry } from '../dao/ledgerDao';

// --- Helper: Change Calculation --- //
const calculateChange = (drawerBalance: any, changeDue: number) => {
  // A simple greedy algorithm for change-making.
  // In a real-world scenario, this needs to be much more robust.
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
      // 1. Calculate totals
      const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
      const totalPaid = Object.entries(paidAmount).reduce((sum, [denom, count]) => sum + (parseInt(denom) * count), 0);
      const changeDue = totalPaid - totalPrice;

      if (changeDue < 0) {
        return reply.code(400).send({ error: 'Payment amount is less than total price.' });
      }

      // 2. Get current drawer balance
      const ledgerEntries = await daos.ledger.listLedgerEntriesByPosInstance(instanceId);
      const drawerBalance: { [key: number]: number } = {};
      ledgerEntries.forEach(entry => {
        if (entry.is_reverted) return;
        const data = JSON.parse(entry.data);
        const amount = data.amount || {};
        const multiplier = (entry.entry_type === 'deposit') ? 1 : -1;
        for (const [denom, count] of Object.entries(amount)) {
          drawerBalance[parseInt(denom)] = (drawerBalance[parseInt(denom)] || 0) + (count as number * multiplier);
        }
      });

      // Add the cash from the current payment to the drawer before calculating change
      for (const [denom, count] of Object.entries(paidAmount)) {
        drawerBalance[parseInt(denom)] = (drawerBalance[parseInt(denom)] || 0) + count;
      }

      // 3. Calculate change to give
      const changeGiven = calculateChange(drawerBalance, changeDue);

      // 4. Record the sale in the ledger
      const saleData = {
        products: cart.map(p => p.id),
        totalPrice,
        paidAmount,
        changeGiven,
      };
      await daos.ledger.createLedgerEntry(instanceId, 'sale', saleData);

      // 5. Send response
      reply.code(201).send({ changeGiven });

    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message || 'Failed to process sale.' });
    }
  });

};
