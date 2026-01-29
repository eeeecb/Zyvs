import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { FlowsService } from './flows.service';
import {
  createFlowSchema,
  updateFlowSchema,
  updateStatusSchema,
  listFlowsQuerySchema,
  testFlowSchema,
  validateNodesForActivation,
} from './flows.schema';

/**
 * Safely formats error for logging (handles Zod errors and circular references)
 */
function formatErrorForLog(error: unknown): string {
  if (error instanceof ZodError) {
    return `ZodError: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

/**
 * Gets user-friendly error message from Zod validation errors
 */
function getZodErrorMessage(error: ZodError): string {
  const firstError = error.errors[0];
  if (firstError) {
    const path = firstError.path.join(' > ');
    return path ? `${path}: ${firstError.message}` : firstError.message;
  }
  return 'Dados inválidos';
}

const flowsService = new FlowsService();

/**
 * GET /api/flows
 * List flows with pagination and filters
 */
export async function listFlows(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const query = listFlowsQuerySchema.parse(req.query);
    const result = await flowsService.listFlows(organizationId, query);

    return reply.send(result);
  } catch (error: any) {
    console.error('Erro ao listar flows:', error);
    return reply.status(500).send({
      error: 'Erro ao listar flows',
      message: error.message,
    });
  }
}

/**
 * GET /api/flows/:id
 * Get a single flow by ID
 */
export async function getFlow(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const flow = await flowsService.getFlow(id, organizationId);
    return reply.send(flow);
  } catch (error: any) {
    if (error.message === 'Flow não encontrado') {
      return reply.status(404).send({ error: error.message });
    }
    return reply.status(500).send({
      error: 'Erro ao buscar flow',
      message: error.message,
    });
  }
}

/**
 * POST /api/flows
 * Create a new flow
 */
export async function createFlow(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const data = createFlowSchema.parse(req.body);
    const flow = await flowsService.createFlow(organizationId, userId, data);

    return reply.status(201).send(flow);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      console.error('Erro de validação ao criar flow:', formatErrorForLog(error));
      return reply.status(400).send({
        error: 'Dados inválidos',
        message: getZodErrorMessage(error),
      });
    }
    if (error instanceof Error) {
      if (error.message.includes('Limite de flows')) {
        return reply.status(403).send({ error: error.message });
      }
      console.error('Erro ao criar flow:', formatErrorForLog(error));
      return reply.status(500).send({
        error: 'Erro ao criar flow',
        message: error.message,
      });
    }
    console.error('Erro desconhecido ao criar flow:', String(error));
    return reply.status(500).send({ error: 'Erro interno ao criar flow' });
  }
}

/**
 * PUT /api/flows/:id
 * Update an existing flow
 */
export async function updateFlow(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const data = updateFlowSchema.parse(req.body);
    const flow = await flowsService.updateFlow(id, organizationId, data);

    return reply.send(flow);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      console.error('Erro de validação ao atualizar flow:', formatErrorForLog(error));
      return reply.status(400).send({
        error: 'Dados inválidos',
        message: getZodErrorMessage(error),
      });
    }
    if (error instanceof Error) {
      if (error.message === 'Flow não encontrado') {
        return reply.status(404).send({ error: error.message });
      }
      console.error('Erro ao atualizar flow:', formatErrorForLog(error));
      return reply.status(500).send({
        error: 'Erro ao atualizar flow',
        message: error.message,
      });
    }
    console.error('Erro desconhecido ao atualizar flow:', String(error));
    return reply.status(500).send({ error: 'Erro interno ao atualizar flow' });
  }
}

/**
 * PATCH /api/flows/:id/status
 * Update flow status (activate/deactivate)
 */
export async function updateFlowStatus(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const data = updateStatusSchema.parse(req.body);
    const flow = await flowsService.updateStatus(
      id,
      organizationId,
      data,
      validateNodesForActivation
    );

    return reply.send(flow);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      console.error('Erro de validação ao atualizar status:', formatErrorForLog(error));
      return reply.status(400).send({
        error: 'Dados inválidos',
        message: getZodErrorMessage(error),
      });
    }
    if (error instanceof Error) {
      if (error.message === 'Flow não encontrado') {
        return reply.status(404).send({ error: error.message });
      }
      if (
        error.message.includes('precisa ter') ||
        error.message.includes('gatilho') ||
        error.message.includes('Configuração incompleta')
      ) {
        return reply.status(400).send({ error: error.message });
      }
      console.error('Erro ao atualizar status:', formatErrorForLog(error));
      return reply.status(500).send({
        error: 'Erro ao atualizar status',
        message: error.message,
      });
    }
    console.error('Erro desconhecido ao atualizar status:', String(error));
    return reply.status(500).send({ error: 'Erro interno ao atualizar status' });
  }
}

/**
 * DELETE /api/flows/:id
 * Delete a flow
 */
export async function deleteFlow(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    await flowsService.deleteFlow(id, organizationId);

    return reply.send({ success: true, message: 'Flow deletado com sucesso' });
  } catch (error: any) {
    if (error.message === 'Flow não encontrado') {
      return reply.status(404).send({ error: error.message });
    }
    if (error.message.includes('execuções em andamento')) {
      return reply.status(400).send({ error: error.message });
    }
    return reply.status(500).send({
      error: 'Erro ao deletar flow',
      message: error.message,
    });
  }
}

/**
 * POST /api/flows/:id/duplicate
 * Duplicate a flow
 */
export async function duplicateFlow(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const flow = await flowsService.duplicateFlow(id, organizationId, userId);

    return reply.status(201).send(flow);
  } catch (error: any) {
    if (error.message === 'Flow não encontrado') {
      return reply.status(404).send({ error: error.message });
    }
    if (error.message.includes('Limite de flows')) {
      return reply.status(403).send({ error: error.message });
    }
    return reply.status(500).send({
      error: 'Erro ao duplicar flow',
      message: error.message,
    });
  }
}

/**
 * POST /api/flows/:id/test
 * Test a flow with a contact (simulation or real)
 */
export async function testFlow(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const data = testFlowSchema.parse(req.body);
    const result = await flowsService.testFlow(
      id,
      organizationId,
      data.contactId,
      data.mode
    );

    return reply.send(result);
  } catch (error: any) {
    if (
      error.message === 'Flow não encontrado' ||
      error.message === 'Contato não encontrado'
    ) {
      return reply.status(404).send({ error: error.message });
    }
    return reply.status(500).send({
      error: 'Erro ao testar flow',
      message: error.message,
    });
  }
}

/**
 * GET /api/flows/:id/executions
 * Get flow executions history
 */
export async function getFlowExecutions(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = req.params as { id: string };
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const result = await flowsService.getExecutions(
      id,
      organizationId,
      Number(page),
      Number(limit)
    );

    return reply.send(result);
  } catch (error: any) {
    if (error.message === 'Flow não encontrado') {
      return reply.status(404).send({ error: error.message });
    }
    return reply.status(500).send({
      error: 'Erro ao buscar execuções',
      message: error.message,
    });
  }
}

/**
 * GET /api/flows/executions/:id
 * Get a single execution details
 */
export async function getExecution(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const execution = await flowsService.getExecution(id, organizationId);

    return reply.send(execution);
  } catch (error: any) {
    if (error.message === 'Execução não encontrada') {
      return reply.status(404).send({ error: error.message });
    }
    return reply.status(500).send({
      error: 'Erro ao buscar execução',
      message: error.message,
    });
  }
}
