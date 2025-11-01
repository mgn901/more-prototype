import Fastify from 'fastify';
import { createDaos } from './dao';
import { registerRoutes } from './routes';

const fastify = Fastify({
  logger: true,
});

const start = async () => {
  try {
    const daos = await createDaos();
    registerRoutes(fastify, daos);

    // Port 3001 is used to avoid conflict with the client dev server (often on 3000)
    // Host 0.0.0.0 is used to be accessible from outside the container
    await fastify.listen({ port: 3001, host: '0.0.0.0' });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
