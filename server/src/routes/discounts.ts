import { FastifyInstance } from 'fastify';
import { Daos } from '../dao';
import { DiscountCondition } from '../dao/discountsDao';

export const registerDiscountsRoutes = (fastify: FastifyInstance, daos: Daos) => {

  // List all discount conditions for a POS instance
  fastify.get('/api/instances/:instanceId/discounts', async (request, reply) => {
    try {
      const { instanceId } = request.params as { instanceId: string };
      const discounts = await daos.discounts.listDiscountsByPosInstance(instanceId);
      reply.send(discounts);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to list discount conditions' });
    }
  });

  // Create a new discount condition
  fastify.post('/api/instances/:instanceId/discounts', async (request, reply) => {
    try {
      const { instanceId } = request.params as { instanceId: string };
      const { type, details } = request.body as { type: DiscountCondition['type'], details: object };

      if (!['quantity_discount', 'value_discount'].includes(type)) {
        return reply.code(400).send({ error: 'Invalid discount type' });
      }

      const newDiscount = await daos.discounts.createDiscount(instanceId, type, details);
      reply.code(201).send(newDiscount);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to create discount condition' });
    }
  });

  // Delete a discount condition
  fastify.delete('/api/discounts/:discountId', async (request, reply) => {
    try {
      const { discountId } = request.params as { discountId: string };
      await daos.discounts.deleteDiscount(parseInt(discountId));
      reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to delete discount condition' });
    }
  });

};
