import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Configuração do Redis - usando REDIS_URL
const connection = new Redis(process.env.REDIS_URL!, {
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
      age: 3600,
      count: 100,
    },
    removeOnFail: {
      age: 86400,
    },
  },
});