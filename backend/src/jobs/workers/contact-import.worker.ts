import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../../lib/prisma';
import { ImportValidator } from '../../modules/contacts/import/import.validator';
import { ImportResult } from '../../modules/contacts/contacts.schema';

const BATCH_SIZE = 100;
const validator = new ImportValidator();

// Configuração do Redis
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

export const contactImportWorker = new Worker(
  'contact-import',
  async (job) => {
    const { rows, userId, organizationId, config } = job.data;

    const result: ImportResult = {
      total: rows.length,
      success: 0,
      duplicates: 0,
      errors: 0,
      errorDetails: [],
    };

    const tagsToCreate = new Set<string>();

    // Processar em batches
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const successfulContacts: any[] = [];

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const lineNumber = i + j + 2;

        try {
          const validatedData = validator.validate(row);

          // Verificar duplicata
          if (validatedData.email && config.skipDuplicates) {
            const existing = await prisma.contact.findFirst({
              where: { organizationId, email: validatedData.email },
            });

            if (existing) {
              if (config.updateExisting) {
                await prisma.contact.update({
                  where: { id: existing.id },
                  data: {
                    name: validatedData.name || existing.name,
                    phone: validatedData.phone || existing.phone,
                    company: validatedData.company,
                    position: validatedData.position,
                    city: validatedData.city,
                    state: validatedData.state,
                    notes: validatedData.notes,
                  },
                });
                result.success++;
              } else {
                result.duplicates++;
              }
              continue;
            }
          }

          // Coletar tags
          if (validatedData.tags && config.createTags) {
            validatedData.tags.forEach((tag) => tagsToCreate.add(tag));
          }

          successfulContacts.push({
            name: validatedData.name || 'Sem nome',
            email: validatedData.email,
            phone: validatedData.phone,
            company: validatedData.company,
            position: validatedData.position,
            city: validatedData.city,
            state: validatedData.state,
            notes: validatedData.notes,
            organizationId,
            status: 'ACTIVE',
          });
        } catch (error: any) {
          result.errors++;
          result.errorDetails.push({
            line: lineNumber,
            error: error.message,
          });
        }
      }

      // Inserir batch
      if (successfulContacts.length > 0) {
        try {
          await prisma.contact.createMany({
            data: successfulContacts,
            skipDuplicates: true,
          });
          result.success += successfulContacts.length;
        } catch (error: any) {
          result.errors += successfulContacts.length;
          result.errorDetails.push({
            line: i,
            error: `Erro ao inserir batch: ${error.message}`,
          });
        }
      }

      // Atualizar progresso
      const progress = Math.round(((i + batch.length) / rows.length) * 100);
      await job.updateProgress(progress);
    }

    // Atualizar contador na organização
    if (result.success > 0) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          currentContacts: {
            increment: result.success,
          },
        },
      });
    }

    // Criar tags
    if (tagsToCreate.size > 0 && config.createTags) {
      for (const tagName of tagsToCreate) {
        try {
          await prisma.tag.upsert({
            where: {
              organizationId_name: {
                organizationId,
                name: tagName,
              },
            },
            create: {
              name: tagName,
              organizationId,
              color: getRandomColor(),
            },
            update: {},
          });
        } catch (error) {
          console.error(`Erro ao criar tag ${tagName}:`, error);
        }
      }
    }

    return result;
  },
  {
    connection,
    concurrency: 2, // Processar 2 jobs em paralelo
  }
);

// Eventos
contactImportWorker.on('completed', (job) => {
  console.log(`✅ Importação ${job.id} completa:`, job.returnvalue);
});

contactImportWorker.on('failed', (job, err) => {
  console.error(`❌ Importação ${job?.id} falhou:`, err.message);
});

function getRandomColor(): string {
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}
