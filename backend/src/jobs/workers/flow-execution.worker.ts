import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../../lib/prisma';
import {
  FlowExecutionJobData,
  FlowDelayJobData,
  scheduleDelayedStep,
  flowExecutionQueue,
} from '../queues/flow-execution.queue';

// Redis connection
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Types from flows.schema (inline to avoid import issues)
interface FlowNode {
  id: string;
  type: 'trigger' | 'delay' | 'message' | 'condition' | 'kanban' | 'tag';
  data: {
    label: string;
    config: any;
  };
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

interface ExecutionLogEntry {
  nodeId: string;
  nodeType: string;
  label: string;
  status: 'success' | 'failed' | 'skipped';
  timestamp: string;
  result?: any;
  error?: string;
}

/**
 * Process a single node and return the next node to execute
 */
async function processNode(
  node: FlowNode,
  job: Job<FlowExecutionJobData>,
  contact: any,
  edges: FlowEdge[]
): Promise<{ nextNodeId: string | null; result: any; shouldContinue: boolean }> {
  const { data } = job;
  const config = node.data.config;

  switch (node.type) {
    case 'trigger':
      // Trigger node just starts the flow
      return {
        nextNodeId: findNextNode(node.id, edges),
        result: {
          triggerType: config.triggerType,
          contact: contact.name,
        },
        shouldContinue: true,
      };

    case 'delay':
      // Schedule delayed continuation
      const delayMs = calculateDelayMs(config.value, config.unit);
      const nextNodeId = findNextNode(node.id, edges);

      if (nextNodeId) {
        await scheduleDelayedStep(
          {
            ...data,
            currentNodeId: nextNodeId,
          },
          delayMs
        );

        // Update execution status to PAUSED
        await prisma.flowExecution.update({
          where: { id: data.executionId },
          data: {
            status: 'PAUSED',
            currentNodeId: node.id,
          },
        });
      }

      return {
        nextNodeId: null, // Stop processing, will resume after delay
        result: {
          waitTime: `${config.value} ${config.unit}`,
          resumeAt: new Date(Date.now() + delayMs).toISOString(),
        },
        shouldContinue: false,
      };

    case 'message':
      // Send message via the appropriate channel
      const messageResult = await sendMessage(
        data.organizationId,
        data.executionId,
        contact,
        config
      );

      return {
        nextNodeId: findNextNode(node.id, edges),
        result: messageResult,
        shouldContinue: true,
      };

    case 'condition':
      // Evaluate condition and choose path
      const conditionResult = evaluateCondition(contact, config);
      const path = conditionResult ? 'yes' : 'no';

      return {
        nextNodeId: findNextNodeWithHandle(node.id, edges, path),
        result: {
          condition: `${config.field} ${config.operator} ${config.value}`,
          result: conditionResult,
          path,
        },
        shouldContinue: true,
      };

    case 'kanban':
      // Move contact to a different pipeline column
      await prisma.contact.update({
        where: { id: contact.id },
        data: { kanbanColumnId: config.columnId },
      });

      const column = await prisma.kanbanColumn.findUnique({
        where: { id: config.columnId },
      });

      return {
        nextNodeId: findNextNode(node.id, edges),
        result: {
          columnId: config.columnId,
          columnName: column?.name || 'Unknown',
        },
        shouldContinue: true,
      };

    case 'tag':
      // Add or remove tag from contact
      if (config.action === 'add') {
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            tags: {
              connect: { id: config.tagId },
            },
          },
        });
      } else {
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            tags: {
              disconnect: { id: config.tagId },
            },
          },
        });
      }

      const tag = await prisma.tag.findUnique({
        where: { id: config.tagId },
      });

      return {
        nextNodeId: findNextNode(node.id, edges),
        result: {
          action: config.action,
          tagId: config.tagId,
          tagName: tag?.name || 'Unknown',
        },
        shouldContinue: true,
      };

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

/**
 * Find next node without handle (standard flow)
 */
function findNextNode(currentNodeId: string, edges: FlowEdge[]): string | null {
  const edge = edges.find((e) => e.source === currentNodeId && !e.sourceHandle);
  return edge?.target || null;
}

/**
 * Find next node with specific handle (for conditions)
 */
function findNextNodeWithHandle(
  currentNodeId: string,
  edges: FlowEdge[],
  handle: string
): string | null {
  const edge = edges.find(
    (e) => e.source === currentNodeId && e.sourceHandle === handle
  );
  return edge?.target || null;
}

/**
 * Calculate delay in milliseconds
 */
function calculateDelayMs(value: number, unit: 'minutes' | 'hours' | 'days'): number {
  switch (unit) {
    case 'minutes':
      return value * 60 * 1000;
    case 'hours':
      return value * 60 * 60 * 1000;
    case 'days':
      return value * 24 * 60 * 60 * 1000;
    default:
      return value * 60 * 1000;
  }
}

/**
 * Evaluate a condition against contact data
 */
function evaluateCondition(
  contact: any,
  config: { field: string; operator: string; value: string }
): boolean {
  if (config.operator === 'has_tag') {
    return contact.tags?.some(
      (t: any) => t.id === config.value || t.name === config.value
    );
  }

  const fieldValue = String(contact[config.field] || '');
  const compareValue = config.value;

  switch (config.operator) {
    case 'equals':
      return fieldValue === compareValue;
    case 'not_equals':
      return fieldValue !== compareValue;
    case 'contains':
      return fieldValue.toLowerCase().includes(compareValue.toLowerCase());
    default:
      return false;
  }
}

/**
 * Send a message (WhatsApp, Email, or SMS)
 */
async function sendMessage(
  organizationId: string,
  executionId: string,
  contact: any,
  config: { channel: string; content: string; mediaUrl?: string }
): Promise<any> {
  // Replace variables in content
  let content = config.content;
  content = content.replace(/\{\{nome\}\}/g, contact.name || '');
  content = content.replace(/\{\{email\}\}/g, contact.email || '');
  content = content.replace(/\{\{telefone\}\}/g, contact.phone || '');

  // Create message record
  const message = await prisma.message.create({
    data: {
      organizationId,
      contactId: contact.id,
      flowExecutionId: executionId,
      channel: config.channel as any,
      content,
      mediaUrl: config.mediaUrl,
      status: 'PENDING',
    },
  });

  // TODO: Actually send the message via integration
  // For now, we'll just mark it as queued
  // This is where you'd call WhatsApp API, SendGrid, Twilio, etc.

  try {
    // Simulate sending (replace with actual integration)
    // await whatsappService.send(contact.phone, content);

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: 'QUEUED',
        // externalId: response.messageId,
      },
    });

    // Determine destination based on channel
    let destination: string | null | undefined;
    switch (config.channel) {
      case 'WHATSAPP':
      case 'SMS':
        destination = contact.phone;
        break;
      case 'TELEGRAM':
        destination = contact.telegramId;
        break;
      default:
        destination = contact.phone;
    }

    return {
      messageId: message.id,
      channel: config.channel,
      destination,
      content,
      status: 'QUEUED',
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
 * Add log entry to execution
 */
async function addLogEntry(
  executionId: string,
  entry: ExecutionLogEntry
): Promise<void> {
  const execution = await prisma.flowExecution.findUnique({
    where: { id: executionId },
    select: { executionLog: true },
  });

  const currentLog = (execution?.executionLog as unknown as ExecutionLogEntry[]) || [];
  currentLog.push(entry);

  await prisma.flowExecution.update({
    where: { id: executionId },
    data: {
      executionLog: currentLog as any,
      nodesExecuted: currentLog.length,
    },
  });
}

/**
 * Main worker processor
 */
async function processFlowExecution(job: Job<FlowExecutionJobData>) {
  const { flowId, executionId, contactId, currentNodeId } = job.data;

  console.log(`Processing flow ${flowId}, execution ${executionId}, node ${currentNodeId}`);

  // Get flow
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
  });

  if (!flow) {
    throw new Error(`Flow ${flowId} not found`);
  }

  // Get contact with tags
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { tags: true },
  });

  if (!contact) {
    throw new Error(`Contact ${contactId} not found`);
  }

  const nodes = flow.nodes as unknown as FlowNode[];
  const edges = flow.edges as unknown as FlowEdge[];

  // Find current node
  const currentNode = nodes.find((n) => n.id === currentNodeId);
  if (!currentNode) {
    throw new Error(`Node ${currentNodeId} not found in flow`);
  }

  // Update execution to RUNNING
  await prisma.flowExecution.update({
    where: { id: executionId },
    data: {
      status: 'RUNNING',
      currentNodeId,
    },
  });

  try {
    // Process current node
    const { nextNodeId, result, shouldContinue } = await processNode(
      currentNode,
      job,
      contact,
      edges
    );

    // Log the execution
    await addLogEntry(executionId, {
      nodeId: currentNode.id,
      nodeType: currentNode.type,
      label: currentNode.data.label,
      status: 'success',
      timestamp: new Date().toISOString(),
      result,
    });

    // If there's a next node and we should continue, queue it
    if (nextNodeId && shouldContinue) {
      await flowExecutionQueue.add(
        `flow-${flowId}-${executionId}-${nextNodeId}`,
        {
          ...job.data,
          currentNodeId: nextNodeId,
        },
        {
          jobId: `exec-${executionId}-${nextNodeId}`,
        }
      );
    } else if (!nextNodeId && shouldContinue) {
      // Flow completed
      await prisma.flowExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update flow stats
      await prisma.flow.update({
        where: { id: flowId },
        data: {
          executionCount: { increment: 1 },
          successCount: { increment: 1 },
          lastExecution: new Date(),
        },
      });

      console.log(`Flow execution ${executionId} completed successfully`);
    }
    // If shouldContinue is false, the flow is paused (waiting for delay)

    return result;
  } catch (error: any) {
    // Log error
    await addLogEntry(executionId, {
      nodeId: currentNode.id,
      nodeType: currentNode.type,
      label: currentNode.data.label,
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error.message,
    });

    // Update execution to FAILED
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        completedAt: new Date(),
      },
    });

    // Update flow stats
    await prisma.flow.update({
      where: { id: flowId },
      data: {
        executionCount: { increment: 1 },
        errorCount: { increment: 1 },
        lastExecution: new Date(),
      },
    });

    throw error;
  }
}

// Create main execution worker
export const flowExecutionWorker = new Worker<FlowExecutionJobData>(
  'flow-execution',
  processFlowExecution,
  {
    connection,
    concurrency: 5,
  }
);

// Create delay worker (resumes paused flows)
export const flowDelayWorker = new Worker<FlowDelayJobData>(
  'flow-delay',
  async (job) => {
    console.log(`Resuming delayed flow execution ${job.data.executionId}`);

    // Update execution to RUNNING
    await prisma.flowExecution.update({
      where: { id: job.data.executionId },
      data: { status: 'RUNNING' },
    });

    // Queue the next step
    await flowExecutionQueue.add(
      `flow-${job.data.flowId}-resume-${job.data.executionId}`,
      {
        flowId: job.data.flowId,
        executionId: job.data.executionId,
        contactId: job.data.contactId,
        organizationId: job.data.organizationId,
        currentNodeId: job.data.currentNodeId,
        context: job.data.context,
      },
      {
        jobId: `exec-${job.data.executionId}-${job.data.currentNodeId}`,
      }
    );
  },
  {
    connection,
    concurrency: 10,
  }
);

// Worker event handlers
flowExecutionWorker.on('completed', (job) => {
  console.log(`Flow execution job ${job.id} completed`);
});

flowExecutionWorker.on('failed', (job, err) => {
  console.error(`Flow execution job ${job?.id} failed:`, err.message);
});

flowDelayWorker.on('completed', (job) => {
  console.log(`Flow delay job ${job.id} completed - execution resumed`);
});

flowDelayWorker.on('failed', (job, err) => {
  console.error(`Flow delay job ${job?.id} failed:`, err.message);
});
