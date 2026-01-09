import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './modules/auth/auth.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { contactsRoutes } from './modules/contacts/contacts.routes';
import { tagsRoutes, contactTagsRoutes } from './modules/tags/tags.routes';
// import { contactImportWorker } from './jobs/workers/contact-import.worker';

const fastify = Fastify({
  logger: process.env.NODE_ENV === 'development',
});

// Configurar content type parser para preservar raw body nos webhooks
fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'buffer' },
  async (req: any, body: Buffer) => {
    // Preservar raw body para validação de assinatura do Stripe
    req.rawBody = body;

    // Fazer parse normal do JSON
    try {
      return JSON.parse(body.toString('utf-8'));
    } catch (err) {
      throw new Error('Invalid JSON');
    }
  }
);

// Plugins
fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://seudominio.com'
    : true, // Aceita qualquer origem em desenvolvimento
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Rate Limiting - proteção contra ataques de força bruta e DDoS
fastify.register(rateLimit, {
  max: 100, // máximo de requisições
  timeWindow: '1 minute', // janela de tempo
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Muitas requisições. Por favor, aguarde um momento antes de tentar novamente.',
  }),
  // Rate limits específicos por rota podem ser configurados nos routes
  keyGenerator: (request) => {
    // Usa o IP do cliente ou o userId se autenticado
    return request.user?.userId || request.ip;
  },
});

// Helmet com CSP configurado
fastify.register(helmet, {
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", process.env.FRONTEND_URL || ''],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false, // Desabilitar em desenvolvimento para facilitar debug
  crossOriginEmbedderPolicy: false, // Necessário para Stripe
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
fastify.register(tagsRoutes, { prefix: '/api/tags' });
fastify.register(contactTagsRoutes, { prefix: '/api/contacts' });

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
  // await contactImportWorker.close();

  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

start();
