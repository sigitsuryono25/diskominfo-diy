import fastify from 'fastify';

const server = fastify({
  logger: true,
});

// Health check endpoint
server.get('/health', async () => {
  return { status: 'OK', message: 'Fastify server is running' };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 8080;
    const host = process.env.HOST || '0.0.0.0';
    await server.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
