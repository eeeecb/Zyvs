import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Redis connection for BullMQ
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export interface FlowExecutionJobData {
  flowId: string;
  executionId: string;
  contactId: string;
  organizationId: string;
  currentNodeId: string;
  context: Record<string, any>; // Variables and state passed between nodes
}

export interface FlowDelayJobData extends FlowExecutionJobData {
  resumeAt: number; // Unix timestamp
}

// Main queue for flow execution
export const flowExecutionQueue = new Queue<FlowExecutionJobData>('flow-execution', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // 7 days
    },
  },
});

// Separate queue for delayed flow steps (delays are scheduled, not immediate)
export const flowDelayQueue = new Queue<FlowDelayJobData>('flow-delay', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400,
      count: 1000,
    },
    removeOnFail: {
      age: 604800,
    },
  },
});

/**
 * Start a flow execution for a contact
 */
export async function startFlowExecution(
  flowId: string,
  executionId: string,
  contactId: string,
  organizationId: string,
  triggerNodeId: string,
  context: Record<string, any> = {}
) {
  return flowExecutionQueue.add(
    `flow-${flowId}-${executionId}`,
    {
      flowId,
      executionId,
      contactId,
      organizationId,
      currentNodeId: triggerNodeId,
      context,
    },
    {
      jobId: `exec-${executionId}-${triggerNodeId}`,
    }
  );
}

/**
 * Schedule a delayed flow step
 */
export async function scheduleDelayedStep(
  data: FlowExecutionJobData,
  delayMs: number
) {
  const resumeAt = Date.now() + delayMs;

  return flowDelayQueue.add(
    `delay-${data.executionId}-${data.currentNodeId}`,
    {
      ...data,
      resumeAt,
    },
    {
      delay: delayMs,
      jobId: `delay-${data.executionId}-${data.currentNodeId}`,
    }
  );
}
