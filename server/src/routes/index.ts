import { FastifyInstance } from 'fastify';
import { Daos } from '../dao';

export const registerRoutes = (fastify: FastifyInstance, daos: Daos) => {

  // Create a new POS instance
  fastify.post('/api/instances', async (request, reply) => {
    try {
      const newInstance = await daos.posInstances.createPosInstance();
      reply.code(201).send(newInstance);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to create POS instance' });
    }
  });

  // Get a POS instance by ID
  fastify.get('/api/instances/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const instance = await daos.posInstances.findPosInstanceById(id);
      if (instance) {
        reply.send(instance);
      } else {
        reply.code(404).send({ error: 'POS instance not found' });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to retrieve POS instance' });
    }
  });

};
