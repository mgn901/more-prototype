import { FastifyInstance } from 'fastify';
import { Daos } from '../dao';
import { LedgerEntry } from '../dao/ledgerDao';

export const registerLedgerRoutes = (fastify: FastifyInstance, daos: Daos) => {

  // List all ledger entries for a POS instance
  fastify.get('/api/instances/:instanceId/ledger', async (request, reply) => {
    try {
      const { instanceId } = request.params as { instanceId: string };
      const entries = await daos.ledger.listLedgerEntriesByPosInstance(instanceId);
      reply.send(entries);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to list ledger entries' });
    }
  });

  // Create a new ledger entry (for deposit, withdrawal, etc.)
  fastify.post('/api/instances/:instanceId/ledger', async (request, reply) => {
    try {
      const { instanceId } = request.params as { instanceId: string };
      const { entry_type, data } = request.body as { entry_type: LedgerEntry['entry_type'], data: object };

      // Basic validation
      if (!['deposit', 'withdrawal', 'sale', 'reversal'].includes(entry_type)) {
        return reply.code(400).send({ error: 'Invalid entry_type' });
      }

      const newEntry = await daos.ledger.createLedgerEntry(instanceId, entry_type, data);
      reply.code(201).send(newEntry);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to create ledger entry' });
    }
  });

  // Revert a ledger entry
  fastify.post('/api/ledger/:entryId/revert', async (request, reply) => {
    try {
      const { entryId } = request.params as { entryId: string };
      await daos.ledger.revertLedgerEntry(parseInt(entryId));
      reply.code(200).send({ message: 'Entry reverted successfully' });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message || 'Failed to revert entry' });
    }
  });

};
