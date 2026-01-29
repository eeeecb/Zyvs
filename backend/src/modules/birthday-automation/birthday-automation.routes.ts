import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  getConfig,
  updateConfig,
  getUpcomingBirthdays,
  getStats,
} from './birthday-automation.controller';

export async function birthdayAutomationRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Config
  fastify.get('/', getConfig);
  fastify.put('/', updateConfig);

  // Upcoming birthdays
  fastify.get('/upcoming', getUpcomingBirthdays);

  // Stats
  fastify.get('/stats', getStats);
}
