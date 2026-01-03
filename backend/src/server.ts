import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { authRoutes } from './modules/auth/auth.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { contactsRoutes } from './modules/contacts/contacts.routes';
import { contactImportWorker } from './jobs/workers/contact-import.worker';

const fastify = Fastify({
  logger: process.env.NODE_ENV === 'development',
});

// Plugins
fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://seudominio.com'
    : true, // Aceita qualquer origem em desenvolvimento
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

fastify.register(helmet, {
  contentSecurityPolicy: false, // Desabilitar para desenvolvimento
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
});

// Multipart para upload de arquivos
fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Declarar tipos customizados para TypeScript
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      userId: string;
      role: 'ADMIN' | 'LOJA';
      organizationId?: string;
    };
  }
}

// Rotas
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(adminRoutes, { prefix: '/api/admin' });
fastify.register(billingRoutes, { prefix: '/api/billing' });
fastify.register(contactsRoutes, { prefix: '/api/contacts' });

// Health check
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };
});

// Root
fastify.get('/', async () => {
  return {
    name: 'Thumdra API',
    version: '1.0.0',
    docs: '/api/docs',
  };
});

// Iniciar servidor
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🚀 Zyva API Server                  ║
║                                       ║
║   Server:  http://localhost:${port}      ║
║   Health:  http://localhost:${port}/health ║
║   Env:     ${process.env.NODE_ENV}              ║
║   Worker:  ✅ Contact Import Worker   ║
║                                       ║
╚═══════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  console.log(`\nReceived signal ${signal}, closing server gracefully...`);

  // Fechar worker BullMQ
  await contactImportWorker.close();

  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

start();
