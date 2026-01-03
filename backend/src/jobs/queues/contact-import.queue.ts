import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Configuração do Redis
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

export const contactImportQueue = new Queue('contact-import', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 3600, // Manter por 1 hora após completar
      count: 100,
    },
    removeOnFail: {
      age: 86400, // Manter por 24h se falhar
    },
  },
});
