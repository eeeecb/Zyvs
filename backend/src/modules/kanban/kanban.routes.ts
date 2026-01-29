import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  listColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
  listContacts,
  moveContact,
  setupDefaultColumns,
} from './kanban.controller';

export async function kanbanRoutes(fastify: FastifyInstance) {
  // Colunas
  fastify.get('/columns', { preHandler: authenticate }, listColumns);
  fastify.post('/columns', { preHandler: authenticate }, createColumn);
  fastify.put('/columns/reorder', { preHandler: authenticate }, reorderColumns);
  fastify.put('/columns/:id', { preHandler: authenticate }, updateColumn);
  fastify.delete('/columns/:id', { preHandler: authenticate }, deleteColumn);
  fastify.post('/columns/setup-defaults', { preHandler: authenticate }, setupDefaultColumns);

  // Contatos no pipeline
  fastify.get('/contacts', { preHandler: authenticate }, listContacts);
  fastify.patch('/contacts/:id/move', { preHandler: authenticate }, moveContact);
}
