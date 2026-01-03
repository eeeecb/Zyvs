import { ImportParser } from './import.parser';
import { ImportValidator } from './import.validator';
import { contactImportQueue } from '../../../jobs/queues/contact-import.queue';
import { prisma } from '../../../lib/prisma';
import { ImportConfig, ImportResult } from '../contacts.schema';
import { ParsedContact } from './import.types';

const SYNC_THRESHOLD = 500;
const BATCH_SIZE = 100;

export class ImportService {
  private parser = new ImportParser();
  private validator = new ImportValidator();

  /**
   * Processar importação (decide entre síncrono ou assíncrono)
   */
  async processImport(params: {
    file: any;
    userId: string;
    organizationId: string;
    config: ImportConfig;
  }) {
    const { file, userId, organizationId, config } = params;

    // 1. Parse arquivo para array de objetos
    const rows = await this.parser.parse(file, config.columnMapping);

    // 2. Decidir: síncrono ou assíncrono?
    if (rows.length < SYNC_THRESHOLD) {
      // SYNC: Processar imediatamente
      const result = await this.processSyncImport(rows, userId, organizationId, config);
      return { type: 'sync', result };
    } else {
      // ASYNC: Criar job no BullMQ
      const job = await contactImportQueue.add('import-contacts', {
        rows,
        userId,
        organizationId,
        config,
      });

      return { type: 'async', jobId: job.id };
    }
  }

  /**
   * Processar importação síncrona (<500 linhas)
   */
  private async processSyncImport(
    rows: any[],
    userId: string,
    organizationId: string,
    config: ImportConfig
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      duplicates: 0,
      errors: 0,
      errorDetails: [],
    };

    const successfulContacts: any[] = [];
    const tagsToCreate = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNumber = i + 2; // +2 porque linha 1 é header

      try {
        // Validar dados
        const validatedData = this.validator.validate(row);

        // Verificar duplicata por email
        if (validatedData.email && config.skipDuplicates) {
          const existing = await prisma.contact.findFirst({
            where: {
              organizationId,
              email: validatedData.email,
            },
          });

          if (existing) {
            if (config.updateExisting) {
              // Atualizar existente
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

        // Coletar tags para criar depois
        if (validatedData.tags && config.createTags) {
          validatedData.tags.forEach((tag) => tagsToCreate.add(tag));
        }

        // Adicionar à lista de sucesso (sem tags por enquanto)
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
          value: JSON.stringify(row).substring(0, 100),
        });
      }
    }

    // Inserir contatos em batch (performance)
    if (successfulContacts.length > 0) {
      try {
        await prisma.contact.createMany({
          data: successfulContacts,
          skipDuplicates: true,
        });
        result.success += successfulContacts.length;

        // Atualizar contador na organização
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            currentContacts: {
              increment: successfulContacts.length,
            },
          },
        });
      } catch (error: any) {
        result.errors += successfulContacts.length;
        result.errorDetails.push({
          line: 0,
          error: `Erro ao inserir em batch: ${error.message}`,
        });
      }
    }

    // Criar tags se necessário
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
              color: this.getRandomColor(),
            },
            update: {},
          });
        } catch (error) {
          // Ignorar erros ao criar tags
          console.error(`Erro ao criar tag ${tagName}:`, error);
        }
      }
    }

    return result;
  }

  /**
   * Obter status de um job assíncrono
   */
  async getJobStatus(jobId: string) {
    const job = await contactImportQueue.getJob(jobId);

    if (!job) {
      throw new Error('Job não encontrado');
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      status: state, // 'waiting', 'active', 'completed', 'failed'
      progress,
      result: job.returnvalue,
    };
  }

  /**
   * Gerar cor aleatória para tag
   */
  private getRandomColor(): string {
    const colors = [
      '#8b5cf6', // purple
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // yellow
      '#ef4444', // red
      '#ec4899', // pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
