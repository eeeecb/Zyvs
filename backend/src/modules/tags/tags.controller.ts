import { FastifyRequest, FastifyReply } from 'fastify';
import { tagSchema } from './tags.schema';
import { prisma } from '../../lib/prisma';
import { flowTriggerService } from '../flows/flow-trigger.service';

/**
 * GET /api/tags
 * Listar todas as tags da organização
 */
export async function listTags(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { search = '' } = req.query as any;
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const where: any = { organizationId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    return reply.send({
      tags: tags.map((tag: any) => ({
        ...tag,
        contactsCount: tag._count.contacts,
        _count: undefined,
      })),
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao listar tags',
      message: error.message,
    });
  }
}

/**
 * GET /api/tags/:id
 * Buscar tag por ID
 */
export async function getTag(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    const tag = await prisma.tag.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    if (!tag) {
      return reply.status(404).send({ error: 'Tag não encontrada' });
    }

    return reply.send({
      ...tag,
      contactsCount: tag._count.contacts,
      _count: undefined,
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao buscar tag',
      message: error.message,
    });
  }
}

/**
 * POST /api/tags
 * Criar nova tag
 */
export async function createTag(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const data = tagSchema.parse(req.body);

    // Verificar se já existe tag com mesmo nome
    const existing = await prisma.tag.findFirst({
      where: {
        organizationId,
        name: { equals: data.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      return reply.status(400).send({ error: 'Já existe uma tag com este nome' });
    }

    const tag = await prisma.tag.create({
      data: {
        ...data,
        organizationId,
      },
    });

    return reply.status(201).send(tag);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao criar tag',
      message: error.message,
    });
  }
}

/**
 * PUT /api/tags/:id
 * Atualizar tag
 */
export async function updateTag(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;
    const data = tagSchema.partial().parse(req.body);

    // Verificar se tag existe
    const existing = await prisma.tag.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Tag não encontrada' });
    }

    // Verificar nome duplicado
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.tag.findFirst({
        where: {
          organizationId,
          name: { equals: data.name, mode: 'insensitive' },
          NOT: { id },
        },
      });

      if (duplicate) {
        return reply.status(400).send({ error: 'Já existe uma tag com este nome' });
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data,
    });

    return reply.send(tag);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao atualizar tag',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/tags/:id
 * Deletar tag
 */
export async function deleteTag(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    // Verificar se tag existe
    const existing = await prisma.tag.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Tag não encontrada' });
    }

    // Deletar tag (as relações many-to-many são removidas automaticamente)
    await prisma.tag.delete({ where: { id } });

    return reply.send({ success: true, message: 'Tag deletada com sucesso' });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao deletar tag',
      message: error.message,
    });
  }
}

/**
 * POST /api/contacts/:contactId/tags
 * Adicionar tag a um contato
 */
export async function addTagToContact(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { contactId } = req.params as { contactId: string };
    const { tagId } = req.body as { tagId: string };
    const organizationId = req.user.organizationId;

    // Verificar se contato existe
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    // Verificar se tag existe
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, organizationId },
    });

    if (!tag) {
      return reply.status(404).send({ error: 'Tag não encontrada' });
    }

    // Adicionar tag ao contato
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        tags: {
          connect: { id: tagId },
        },
      },
    });

    // Trigger flows for tag added
    flowTriggerService.onTagAdded(contactId, organizationId!, tagId).catch((err) => {
      console.error('Error triggering flows for tag added:', err);
    });

    return reply.send({ success: true, message: 'Tag adicionada ao contato' });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao adicionar tag',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/contacts/:contactId/tags/:tagId
 * Remover tag de um contato
 */
export async function removeTagFromContact(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { contactId, tagId } = req.params as { contactId: string; tagId: string };
    const organizationId = req.user.organizationId;

    // Verificar se contato existe
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    // Remover tag do contato
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
    });

    // Trigger flows for tag removed
    flowTriggerService.onTagRemoved(contactId, organizationId!, tagId).catch((err) => {
      console.error('Error triggering flows for tag removed:', err);
    });

    return reply.send({ success: true, message: 'Tag removida do contato' });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao remover tag',
      message: error.message,
    });
  }
}
