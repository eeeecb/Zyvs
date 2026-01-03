import { FastifyRequest, FastifyReply } from 'fastify';
import { ImportService } from './import/import.service';
import { importConfigSchema, contactSchema } from './contacts.schema';
import { prisma } from '../../lib/prisma';

const importService = new ImportService();

/**
 * POST /api/contacts/import
 * Upload e iniciar importação de contatos
 */
export async function importContacts(req: FastifyRequest, reply: FastifyReply) {
  try {
    // 1. Receber arquivo via multipart
    const data = await req.file();

    if (!data) {
      return reply.status(400).send({ error: 'Arquivo não enviado' });
    }

    // 2. Validar tipo e tamanho
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Formato não suportado',
        message: 'Use arquivos CSV ou Excel (.xlsx)',
      });
    }

    // Limite de 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    const buffer = await data.toBuffer();
    if (buffer.length > MAX_SIZE) {
      return reply.status(400).send({
        error: 'Arquivo muito grande',
        message: 'O tamanho máximo é 10MB',
      });
    }

    // 3. Receber configurações do body (via fields do multipart)
    const fields = data.fields as any;
    const config = importConfigSchema.parse({
      skipDuplicates: fields.skipDuplicates?.value === 'true',
      updateExisting: fields.updateExisting?.value === 'true',
      createTags: fields.createTags?.value === 'true',
      columnMapping: fields.columnMapping?.value
        ? JSON.parse(fields.columnMapping.value as string)
        : {},
    });

    // 4. Processar importação
    const result = await importService.processImport({
      file: data,
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      config,
    });

    // 5. Retornar resultado
    // Se síncrono: { type: 'sync', result: {...} }
    // Se assíncrono: { type: 'async', jobId: '...' }
    return reply.send(result);
  } catch (error: any) {
    console.error('Erro ao processar importação:', error);
    return reply.status(500).send({
      error: 'Erro ao processar importação',
      message: error.message,
    });
  }
}

/**
 * GET /api/contacts/import/:jobId/status
 * Verificar status de importação assíncrona
 */
export async function getImportStatus(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { jobId } = req.params as { jobId: string };
    const status = await importService.getJobStatus(jobId);
    return reply.send(status);
  } catch (error: any) {
    return reply.status(404).send({
      error: 'Job não encontrado',
      message: error.message,
    });
  }
}

/**
 * GET /api/contacts/template
 * Baixar template CSV de exemplo
 */
export async function downloadTemplate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const path = require('path');
    const fs = require('fs');

    const templatePath = path.join(__dirname, '../../../public/template-contatos.csv');

    if (!fs.existsSync(templatePath)) {
      return reply.status(404).send({ error: 'Template não encontrado' });
    }

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="template-contatos.csv"');

    return reply.sendFile('template-contatos.csv', path.join(__dirname, '../../../public'));
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao baixar template',
      message: error.message,
    });
  }
}

/**
 * GET /api/contacts
 * Listar contatos com paginação, busca e filtros
 */
export async function listContacts(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query as any;
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Buscar contatos
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return reply.send({
      contacts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar contatos:', error);
    return reply.status(500).send({
      error: 'Erro ao listar contatos',
      message: error.message,
    });
  }
}

/**
 * GET /api/contacts/:id
 * Buscar contato por ID
 */
export async function getContact(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    const contact = await prisma.contact.findFirst({
      where: { id, organizationId },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    return reply.send(contact);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao buscar contato',
      message: error.message,
    });
  }
}

/**
 * POST /api/contacts
 * Criar novo contato
 */
export async function createContact(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const data = contactSchema.parse(req.body);

    // Verificar duplicata por email
    if (data.email) {
      const existing = await prisma.contact.findFirst({
        where: { organizationId, email: data.email },
      });

      if (existing) {
        return reply.status(400).send({ error: 'Já existe um contato com este email' });
      }
    }

    // Separar campos do modelo Prisma dos campos customizados
    const { company, position, city, state, customFields, ...prismaData } = data as any;

    // Montar customFields com os dados extras
    const allCustomFields = {
      ...(customFields || {}),
      ...(company && { company }),
      ...(position && { position }),
      ...(city && { city }),
      ...(state && { state }),
    };

    const contact = await prisma.contact.create({
      data: {
        ...prismaData,
        organizationId,
        status: 'ACTIVE',
        customFields: Object.keys(allCustomFields).length > 0 ? allCustomFields : undefined,
      },
    });

    // Incrementar contador
    await prisma.organization.update({
      where: { id: organizationId },
      data: { currentContacts: { increment: 1 } },
    });

    return reply.status(201).send(contact);
  } catch (error: any) {
    console.error('Erro ao criar contato:', error);
    return reply.status(500).send({
      error: 'Erro ao criar contato',
      message: error.message,
    });
  }
}

/**
 * PUT /api/contacts/:id
 * Atualizar contato
 */
export async function updateContact(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;
    const data = contactSchema.partial().parse(req.body);

    // Verificar se contato existe
    const existing = await prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    // Separar campos do modelo Prisma dos campos customizados
    const { company, position, city, state, customFields, ...prismaData } = data as any;

    // Mesclar customFields existentes com novos
    let updatedCustomFields = existing.customFields as any || {};
    if (company !== undefined) updatedCustomFields.company = company;
    if (position !== undefined) updatedCustomFields.position = position;
    if (city !== undefined) updatedCustomFields.city = city;
    if (state !== undefined) updatedCustomFields.state = state;
    if (customFields) updatedCustomFields = { ...updatedCustomFields, ...customFields };

    // Atualizar
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...prismaData,
        customFields: Object.keys(updatedCustomFields).length > 0 ? updatedCustomFields : undefined,
      },
    });

    return reply.send(contact);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao atualizar contato',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/contacts/:id
 * Deletar contato
 */
export async function deleteContact(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    // Verificar se contato existe
    const existing = await prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    // Deletar
    await prisma.contact.delete({ where: { id } });

    // Decrementar contador
    await prisma.organization.update({
      where: { id: organizationId },
      data: { currentContacts: { decrement: 1 } },
    });

    return reply.send({ success: true, message: 'Contato deletado com sucesso' });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao deletar contato',
      message: error.message,
    });
  }
}
