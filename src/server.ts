import 'dotenv/config';
import fastify from 'fastify';
import { appRoutes } from './infrastructure/http/routes/index.js';
import { authenticate } from './infrastructure/http/middlewares/auth.middleware.js';
import { AppException } from './domain/exceptions/app.exceptions.js';

const server = fastify({
  logger: true,
});

server.setErrorHandler((error, _request, reply) => {
  if (error instanceof AppException) {
    return reply.status(error.statusCode).send({
      error_code: error.errorCode ?? (error.statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR'),
      message: error.message,
    });
  }

  server.log.error(error);
  const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 600
    ? error.statusCode
    : 500;
  return reply.status(statusCode).send({
    error_code: error.code ?? (statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR'),
    message: statusCode < 500 ? error.message : 'Terjadi kesalahan pada server',
  });
});

server.setNotFoundHandler((_request, reply) => {
  return reply.status(404).send({
    error_code: 'NOT_FOUND',
    message: 'Endpoint tidak ditemukan',
  });
});

// Health check endpoint
server.get('/health', async () => {
  return { status: 'OK', message: 'Fastify server is running' };
});

server.decorateRequest('user', null);
server.addHook('onRequest', async (request) => {
  const requestPath = request.url.split('?')[0].replace(/\/+$/, '');
  if (requestPath.startsWith('/api/') && !requestPath.endsWith('/auth/login')) {
    await authenticate(request);
  }
});

server.register(appRoutes, { prefix: '/api/v1' });

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

void start();
