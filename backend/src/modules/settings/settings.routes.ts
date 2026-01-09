import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middlewares/auth.middleware';
import * as settingsController from './settings.controller';

export async function settingsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // =====================================================
  // PROFILE ROUTES
  // =====================================================

  fastify.patch('/profile', settingsController.updateProfile);
  fastify.patch('/password', settingsController.changePassword);

  // =====================================================
  // NOTIFICATIONS ROUTES
  // =====================================================

  fastify.patch('/notifications', settingsController.updateNotifications);

  // =====================================================
  // 2FA ROUTES
  // =====================================================

  fastify.post('/2fa/enable', settingsController.enable2FA);
  fastify.post('/2fa/verify', settingsController.verify2FA);
  fastify.post('/2fa/disable', settingsController.disable2FA);

  // =====================================================
  // SESSION ROUTES
  // =====================================================

  fastify.get('/sessions', settingsController.getSessions);
  fastify.delete('/sessions/:sessionId', settingsController.revokeSession);
  fastify.delete('/sessions', settingsController.revokeAllSessions);

  // =====================================================
  // DATA EXPORT ROUTES
  // =====================================================

  fastify.post('/export-data', settingsController.requestDataExport);
  fastify.get('/export-data', settingsController.getDataExportStatus);
}
