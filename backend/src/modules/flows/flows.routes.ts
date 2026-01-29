import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  listFlows,
  getFlow,
  createFlow,
  updateFlow,
  updateFlowStatus,
  deleteFlow,
  duplicateFlow,
  testFlow,
  getFlowExecutions,
  getExecution,
} from './flows.controller';

export async function flowsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // CRUD operations
  fastify.get('/', listFlows);
  fastify.get('/:id', getFlow);
  fastify.post('/', createFlow);
  fastify.put('/:id', updateFlow);
  fastify.delete('/:id', deleteFlow);

  // Status management
  fastify.patch('/:id/status', updateFlowStatus);

  // Duplicate
  fastify.post('/:id/duplicate', duplicateFlow);

  // Test/simulate
  fastify.post('/:id/test', testFlow);

  // Executions
  fastify.get('/:id/executions', getFlowExecutions);
}

// Separate routes for execution details (different prefix)
export async function flowExecutionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/:id', getExecution);
}
