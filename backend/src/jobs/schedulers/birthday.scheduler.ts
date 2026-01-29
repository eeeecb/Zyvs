import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { processBirthdays } from '../workers/birthday.worker';

// Redis connection
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Queue for scheduled birthday checks
const birthdaySchedulerQueue = new Queue('birthday-scheduler', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

/**
 * Initialize the birthday cron scheduler
 * Runs every hour to check for birthdays at the configured send hour
 */
export async function initBirthdayScheduler(): Promise<void> {
  console.log('[Birthday Scheduler] Initializing...');

  // Remove existing repeatable job to avoid duplicates on restart
  const existingJobs = await birthdaySchedulerQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await birthdaySchedulerQueue.removeRepeatableByKey(job.key);
  }

  // Add repeatable job that runs every hour
  await birthdaySchedulerQueue.add(
    'birthday-check',
    {},
    {
      repeat: {
        pattern: '0 * * * *', // Every hour at minute 0
      },
      jobId: 'birthday-hourly-check',
    }
  );

  console.log('[Birthday Scheduler] Scheduled hourly birthday check');
}

// Worker that processes the scheduled jobs
export const birthdaySchedulerWorker = new Worker(
  'birthday-scheduler',
  async () => {
    console.log('[Birthday Scheduler] Running scheduled birthday check...');
    await processBirthdays();
    console.log('[Birthday Scheduler] Scheduled check complete');
  },
  {
    connection,
    concurrency: 1,
  }
);

birthdaySchedulerWorker.on('completed', (job) => {
  console.log(`[Birthday Scheduler] Job ${job.id} completed`);
});

birthdaySchedulerWorker.on('failed', (job, err) => {
  console.error(`[Birthday Scheduler] Job ${job?.id} failed:`, err.message);
});
