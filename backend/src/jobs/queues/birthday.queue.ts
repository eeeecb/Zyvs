import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Redis connection for BullMQ
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export interface BirthdayJobData {
  organizationId: string;
  contactId: string;
  contactName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactTelegramId?: string | null;
  template: string;
  channel: 'WHATSAPP' | 'TELEGRAM' | 'SMS' | 'INSTAGRAM_DM';
}

// Queue for individual birthday messages
export const birthdayMessageQueue = new Queue<BirthdayJobData>('birthday-message', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 500,
    },
    removeOnFail: {
      age: 604800, // 7 days
    },
  },
});

/**
 * Queue a birthday message for sending
 */
export async function queueBirthdayMessage(data: BirthdayJobData) {
  return birthdayMessageQueue.add(
    `birthday-${data.organizationId}-${data.contactId}`,
    data,
    {
      jobId: `birthday-${data.organizationId}-${data.contactId}-${new Date().toISOString().split('T')[0]}`,
    }
  );
}
