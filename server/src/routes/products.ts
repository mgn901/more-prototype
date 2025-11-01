import { FastifyInstance } from 'fastify';
import { Daos } from '../dao';

export const registerProductsRoutes = (fastify: FastifyInstance, daos: Daos) => {

  // List all products for a POS instance
  fastify.get('/api/instances/:instanceId/products', async (request, reply) => {
    try {
      const { instanceId } = request.params as { instanceId: string };
      const products = await daos.products.listProductsByPosInstance(instanceId);
      reply.send(products);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to list products' });
    }
  });

  // Create a new product
  fastify.post('/api/instances/:instanceId/products', async (request, reply) => {
    try {
      const { instanceId } = request.params as { instanceId: string };
      const { name, price, seller_name } = request.body as { name: string, price: number, seller_name: string | null };
      const newProduct = await daos.products.createProduct(instanceId, name, price, seller_name);
      reply.code(201).send(newProduct);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to create product' });
    }
  });

  // Update a product
  fastify.put('/api/products/:productId', async (request, reply) => {
    try {
      const { productId } = request.params as { productId: string };
      const { name, price, seller_name } = request.body as { name: string, price: number, seller_name: string | null };
      // Note: In a real app, you'd verify that the user has permission to update this product.
      const updatedProduct = await daos.products.updateProduct(parseInt(productId), name, price, seller_name);
      reply.send(updatedProduct);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to update product' });
    }
  });

  // Delete a product
  fastify.delete('/api/products/:productId', async (request, reply) => {
    try {
      const { productId } = request.params as { productId: string };
      // Note: In a real app, you'd verify that the user has permission to delete this product.
      await daos.products.deleteProduct(parseInt(productId));
      reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to delete product' });
    }
  });

};
