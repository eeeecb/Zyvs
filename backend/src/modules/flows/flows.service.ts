import { prisma } from '../../lib/prisma';
import type {
  CreateFlowInput,
  UpdateFlowInput,
  UpdateStatusInput,
  ListFlowsQuery,
  FlowNode,
} from './flows.schema';

export class FlowsService {
  /**
   * List flows with pagination and filters
   */
  async listFlows(organizationId: string, query: ListFlowsQuery) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [flows, total] = await Promise.all([
      prisma.flow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          status: true,
          executionCount: true,
          successCount: true,
          errorCount: true,
          lastExecution: true,
          createdAt: true,
          updatedAt: true,
          nodes: true,
        },
      }),
      prisma.flow.count({ where }),
    ]);

    // Calculate success rate for each flow
    const flowsWithStats = flows.map((flow) => {
      const successRate =
        flow.executionCount > 0
          ? Math.round((flow.successCount / flow.executionCount) * 100)
          : null;

      // Count nodes to show in card
      const nodes = flow.nodes as FlowNode[];
      const nodeCount = Array.isArray(nodes) ? nodes.length : 0;

      return {
        ...flow,
        successRate,
        nodeCount,
      };
    });

    return {
      flows: flowsWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single flow by ID
   */
  async getFlow(id: string, organizationId: string) {
    const flow = await prisma.flow.findFirst({
      where: { id, organizationId },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!flow) {
      throw new Error('Flow não encontrado');
    }

    return flow;
  }

  /**
   * Create a new flow
   */
  async createFlow(
    organizationId: string,
    userId: string,
    data: CreateFlowInput
  ) {
    // Check organization limits
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxFlows: true, currentFlows: true },
    });

    if (org && org.currentFlows >= org.maxFlows) {
      throw new Error(
        `Limite de flows atingido (${org.maxFlows}). Faça upgrade do plano para criar mais automações.`
      );
    }

    const flow = await prisma.flow.create({
      data: {
        organizationId,
        createdBy: userId,
        name: data.name,
        description: data.description,
        category: data.category,
        nodes: data.nodes as any,
        edges: data.edges as any,
        status: 'DRAFT',
      },
    });

    // Increment organization flow count
    await prisma.organization.update({
      where: { id: organizationId },
      data: { currentFlows: { increment: 1 } },
    });

    return flow;
  }

  /**
   * Update an existing flow
   */
  async updateFlow(
    id: string,
    organizationId: string,
    data: UpdateFlowInput
  ) {
    // Check if flow exists
    const existing = await prisma.flow.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new Error('Flow não encontrado');
    }

    const flow = await prisma.flow.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.nodes && { nodes: data.nodes as any }),
        ...(data.edges && { edges: data.edges as any }),
      },
    });

    return flow;
  }

  /**
   * Update flow status (activate/deactivate)
   */
  async updateStatus(
    id: string,
    organizationId: string,
    data: UpdateStatusInput,
    validateNodes?: (nodes: FlowNode[]) => string[]
  ) {
    // Check if flow exists
    const existing = await prisma.flow.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new Error('Flow não encontrado');
    }

    // Validate flow before activation
    if (data.status === 'ACTIVE') {
      const nodes = existing.nodes as FlowNode[];
      if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error('Flow precisa ter pelo menos um nó para ser ativado');
      }

      const hasTrigger = nodes.some((node) => node.type === 'trigger');
      if (!hasTrigger) {
        throw new Error('Flow precisa ter um gatilho para ser ativado');
      }

      // Strict validation for all nodes
      if (validateNodes) {
        const validationErrors = validateNodes(nodes);
        if (validationErrors.length > 0) {
          throw new Error(`Configuração incompleta: ${validationErrors[0]}`);
        }
      }
    }

    const flow = await prisma.flow.update({
      where: { id },
      data: { status: data.status },
    });

    return flow;
  }

  /**
   * Delete a flow
   */
  async deleteFlow(id: string, organizationId: string) {
    // Check if flow exists
    const existing = await prisma.flow.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new Error('Flow não encontrado');
    }

    // Check if there are running executions
    const runningExecutions = await prisma.flowExecution.count({
      where: { flowId: id, status: 'RUNNING' },
    });

    if (runningExecutions > 0) {
      throw new Error(
        'Não é possível excluir um flow com execuções em andamento'
      );
    }

    await prisma.flow.delete({ where: { id } });

    // Decrement organization flow count
    await prisma.organization.update({
      where: { id: organizationId },
      data: { currentFlows: { decrement: 1 } },
    });

    return { success: true };
  }

  /**
   * Duplicate a flow
   */
  async duplicateFlow(id: string, organizationId: string, userId: string) {
    // Get original flow
    const original = await prisma.flow.findFirst({
      where: { id, organizationId },
    });

    if (!original) {
      throw new Error('Flow não encontrado');
    }

    // Check organization limits
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxFlows: true, currentFlows: true },
    });

    if (org && org.currentFlows >= org.maxFlows) {
      throw new Error(
        `Limite de flows atingido (${org.maxFlows}). Faça upgrade do plano.`
      );
    }

    // Create duplicate
    const duplicate = await prisma.flow.create({
      data: {
        organizationId,
        createdBy: userId,
        name: `${original.name} (cópia)`,
        description: original.description,
        category: original.category,
        nodes: original.nodes as any,
        edges: original.edges as any,
        status: 'DRAFT',
      },
    });

    // Increment organization flow count
    await prisma.organization.update({
      where: { id: organizationId },
      data: { currentFlows: { increment: 1 } },
    });

    return duplicate;
  }

  /**
   * Get flow executions history
   */
  async getExecutions(
    flowId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 20
  ) {
    // Check if flow exists
    const flow = await prisma.flow.findFirst({
      where: { id: flowId, organizationId },
    });

    if (!flow) {
      throw new Error('Flow não encontrado');
    }

    const skip = (page - 1) * limit;

    const [executions, total] = await Promise.all([
      prisma.flowExecution.findMany({
        where: { flowId },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.flowExecution.count({ where: { flowId } }),
    ]);

    return {
      executions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single execution details
   */
  async getExecution(executionId: string, organizationId: string) {
    const execution = await prisma.flowExecution.findFirst({
      where: { id: executionId },
      include: {
        flow: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        messages: {
          select: {
            id: true,
            channel: true,
            content: true,
            status: true,
            sentAt: true,
            deliveredAt: true,
            openedAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!execution || execution.flow.organizationId !== organizationId) {
      throw new Error('Execução não encontrada');
    }

    return execution;
  }

  /**
   * Test/simulate a flow (without actually sending messages)
   */
  async testFlow(
    flowId: string,
    organizationId: string,
    contactId: string,
    mode: 'simulation' | 'real'
  ) {
    // Get flow
    const flow = await prisma.flow.findFirst({
      where: { id: flowId, organizationId },
    });

    if (!flow) {
      throw new Error('Flow não encontrado');
    }

    // Get contact
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      include: { tags: true },
    });

    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const nodes = flow.nodes as FlowNode[];
    const edges = flow.edges as any[];

    if (!Array.isArray(nodes) || nodes.length === 0) {
      throw new Error('Flow não tem nós para executar');
    }

    // Simulate execution step by step
    const steps: any[] = [];
    let currentNodeId = nodes.find((n) => n.type === 'trigger')?.id;

    while (currentNodeId) {
      const currentNode = nodes.find((n) => n.id === currentNodeId);
      if (!currentNode) break;

      const step: any = {
        nodeId: currentNode.id,
        type: currentNode.type,
        label: currentNode.data.label,
        config: currentNode.data.config,
        status: 'success',
      };

      // Process based on node type
      switch (currentNode.type) {
        case 'trigger':
          step.result = {
            contact: contact.name,
            triggerType: (currentNode.data.config as any).triggerType,
          };
          break;

        case 'delay':
          const delayConfig = currentNode.data.config as any;
          step.result = {
            waitTime: `${delayConfig.value} ${delayConfig.unit}`,
            simulatedEndDate: new Date(
              Date.now() +
                delayConfig.value *
                  (delayConfig.unit === 'minutes'
                    ? 60000
                    : delayConfig.unit === 'hours'
                    ? 3600000
                    : 86400000)
            ).toISOString(),
          };
          break;

        case 'message':
          const msgConfig = currentNode.data.config as any;
          // Replace variables in content
          let content = msgConfig.content;
          content = content.replace(/\{\{nome\}\}/g, contact.name || '');
          content = content.replace(/\{\{email\}\}/g, contact.email || '');
          content = content.replace(/\{\{telefone\}\}/g, contact.phone || '');

          step.result = {
            channel: msgConfig.channel,
            content,
            destination:
              msgConfig.channel === 'WHATSAPP'
                ? contact.phone
                : msgConfig.channel === 'EMAIL'
                ? contact.email
                : contact.phone,
            wouldSend: mode === 'real',
          };
          break;

        case 'condition':
          const condConfig = currentNode.data.config as any;
          let conditionResult = false;

          if (condConfig.operator === 'has_tag') {
            conditionResult = contact.tags.some(
              (t) => t.id === condConfig.value || t.name === condConfig.value
            );
          } else {
            const fieldValue = (contact as any)[condConfig.field] || '';
            switch (condConfig.operator) {
              case 'equals':
                conditionResult = fieldValue === condConfig.value;
                break;
              case 'not_equals':
                conditionResult = fieldValue !== condConfig.value;
                break;
              case 'contains':
                conditionResult = fieldValue.includes(condConfig.value);
                break;
            }
          }

          step.result = {
            condition: `${condConfig.field} ${condConfig.operator} ${condConfig.value}`,
            result: conditionResult,
            path: conditionResult ? 'yes' : 'no',
          };
          break;

        case 'kanban':
          const kanbanConfig = currentNode.data.config as any;
          const column = await prisma.kanbanColumn.findUnique({
            where: { id: kanbanConfig.columnId },
          });
          step.result = {
            columnId: kanbanConfig.columnId,
            columnName: column?.name || 'Desconhecida',
          };
          break;

        case 'tag':
          const tagConfig = currentNode.data.config as any;
          const tag = await prisma.tag.findUnique({
            where: { id: tagConfig.tagId },
          });
          step.result = {
            action: tagConfig.action,
            tagId: tagConfig.tagId,
            tagName: tag?.name || 'Desconhecida',
          };
          break;
      }

      steps.push(step);

      // Find next node
      let nextEdge;
      if (currentNode.type === 'condition') {
        const path = step.result.path;
        nextEdge = edges.find(
          (e) => e.source === currentNodeId && e.sourceHandle === path
        );
      } else {
        nextEdge = edges.find((e) => e.source === currentNodeId);
      }

      currentNodeId = nextEdge?.target;
    }

    return {
      flow: {
        id: flow.id,
        name: flow.name,
      },
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      },
      mode,
      steps,
      summary: {
        totalSteps: steps.length,
        messagesCount: steps.filter((s) => s.type === 'message').length,
      },
    };
  }
}
