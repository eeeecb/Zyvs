import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  importContacts,
  getImportStatus,
  downloadTemplate,
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from './contacts.controller';

export async function contactsRoutes(fastify: FastifyInstance) {
  // Download de template CSV (público - não requer autenticação)
  fastify.get('/template', downloadTemplate);

  // CRUD de contatos (requer autenticação)
  fastify.get('/', { preHandler: authenticate }, listContacts);
  fastify.get('/:id', { preHandler: authenticate }, getContact);
  fastify.post('/', { preHandler: authenticate }, createContact);
  fastify.put('/:id', { preHandler: authenticate }, updateContact);
  fastify.delete('/:id', { preHandler: authenticate }, deleteContact);

  // Upload e iniciar importação (requer autenticação)
  fastify.post('/import', { preHandler: authenticate }, importContacts);

  // Verificar status de importação assíncrona (requer autenticação)
  fastify.get('/import/:jobId/status', { preHandler: authenticate }, getImportStatus);
}
