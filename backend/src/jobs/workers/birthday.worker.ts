import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../../lib/prisma';
import { BirthdayJobData, queueBirthdayMessage } from '../queues/birthday.queue';

// Redis connection
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

/**
 * Replace template variables with contact data
 */
function replaceTemplateVariables(
  template: string,
  contact: { name: string; email?: string | null; phone?: string | null }
): string {
  let content = template;
  content = content.replace(/\{\{nome\}\}/g, contact.name || '');
  content = content.replace(/\{\{email\}\}/g, contact.email || '');
  content = content.replace(/\{\{telefone\}\}/g, contact.phone || '');
  return content;
}

/**
 * Process a single birthday message
 */
async function processBirthdayMessage(job: Job<BirthdayJobData>) {
  const { organizationId, contactId, contactName, contactPhone, contactEmail, contactTelegramId, template, channel } = job.data;

  console.log(`Sending birthday message to ${contactName} (${contactId}) via ${channel}`);

  // Generate message content
  const content = replaceTemplateVariables(template, {
    name: contactName,
    email: contactEmail,
    phone: contactPhone,
  });

  // Determine destination based on channel
  let destination: string | null | undefined;
  let missingField: string;
  switch (channel) {
    case 'WHATSAPP':
    case 'SMS':
      destination = contactPhone;
      missingField = 'phone';
      break;
    case 'TELEGRAM':
      destination = contactTelegramId;
      missingField = 'telegramId';
      break;
    default:
      destination = contactPhone;
      missingField = 'phone';
  }

  if (!destination) {
    throw new Error(`No ${missingField} for contact ${contactName}`);
  }

  // Create message record
  const message = await prisma.message.create({
    data: {
      organizationId,
      contactId,
      channel,
      content,
      status: 'PENDING',
    },
  });

  try {
    // TODO: Actually send the message via integration
    // For now, just mark it as queued
    // This is where you'd call WhatsApp API, SendGrid, Twilio, etc.

    // Example:
    // if (channel === 'WHATSAPP') {
    //   await whatsappService.send(destination, content);
    // } else if (channel === 'EMAIL') {
    //   await emailService.send(destination, 'Feliz Aniversário!', content);
    // }

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: 'QUEUED',
        // externalId: response.messageId,
      },
    });

    // Update birthday automation stats
    await prisma.birthdayAutomation.update({
      where: { organizationId },
      data: {
        totalSent: { increment: 1 },
        lastSentAt: new Date(),
      },
    });

    console.log(`Birthday message sent to ${contactName} (${message.id})`);

    return {
      success: true,
      messageId: message.id,
      contactName,
      channel,
    };
  } catch (error: any) {
    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        failedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Check all organizations and send birthday messages
 * This function is called by the cron scheduler
 */
export async function processBirthdays(): Promise<void> {
  const now = new Date();
  const currentHour = now.getHours();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log(`[Birthday Cron] Running birthday check at hour ${currentHour}`);

  // Find all enabled birthday automations that should send at this hour
  const automations = await prisma.birthdayAutomation.findMany({
    where: {
      isEnabled: true,
      sendAtHour: currentHour,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  console.log(`[Birthday Cron] Found ${automations.length} organizations to process`);

  for (const automation of automations) {
    if (!automation.organization.isActive) {
      console.log(`[Birthday Cron] Skipping inactive organization: ${automation.organization.name}`);
      continue;
    }

    console.log(`[Birthday Cron] Processing organization: ${automation.organization.name}`);

    // Find contacts with birthdays today
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: automation.organizationId,
        status: 'ACTIVE',
        birthdate: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        telegramId: true,
        birthdate: true,
      },
    });

    // Filter contacts whose birthday is today
    const birthdayContacts = contacts.filter((contact) => {
      if (!contact.birthdate) return false;
      const birthdate = new Date(contact.birthdate);
      return (
        birthdate.getMonth() === today.getMonth() &&
        birthdate.getDate() === today.getDate()
      );
    });

    console.log(`[Birthday Cron] Found ${birthdayContacts.length} birthdays today for ${automation.organization.name}`);

    // Queue birthday messages
    for (const contact of birthdayContacts) {
      // Check if message was already sent today
      const existingMessage = await prisma.message.findFirst({
        where: {
          organizationId: automation.organizationId,
          contactId: contact.id,
          channel: automation.channel,
          createdAt: {
            gte: today,
          },
          content: {
            contains: 'Aniversário',
          },
        },
      });

      if (existingMessage) {
        console.log(`[Birthday Cron] Birthday message already sent to ${contact.name} today, skipping`);
        continue;
      }

      await queueBirthdayMessage({
        organizationId: automation.organizationId,
        contactId: contact.id,
        contactName: contact.name,
        contactPhone: contact.phone,
        contactEmail: contact.email,
        contactTelegramId: contact.telegramId,
        template: automation.template,
        channel: automation.channel,
      });

      console.log(`[Birthday Cron] Queued birthday message for ${contact.name}`);
    }
  }

  console.log(`[Birthday Cron] Birthday processing complete`);
}

// Create birthday message worker
export const birthdayMessageWorker = new Worker<BirthdayJobData>(
  'birthday-message',
  processBirthdayMessage,
  {
    connection,
    concurrency: 5,
  }
);

// Worker event handlers
birthdayMessageWorker.on('completed', (job) => {
  console.log(`Birthday message job ${job.id} completed`);
});

birthdayMessageWorker.on('failed', (job, err) => {
  console.error(`Birthday message job ${job?.id} failed:`, err.message);
});
