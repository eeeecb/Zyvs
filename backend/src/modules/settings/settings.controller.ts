import type { FastifyRequest, FastifyReply } from 'fastify';
import { settingsService } from './settings.service';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateNotificationsSchema,
  enable2FASchema,
  verify2FASchema,
  disable2FASchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type UpdateNotificationsInput,
  type Enable2FAInput,
  type Verify2FAInput,
  type Disable2FAInput,
} from './settings.schema';

// =====================================================
// PROFILE CONTROLLERS
// =====================================================

export async function updateProfile(
  request: FastifyRequest<{ Body: UpdateProfileInput }>,
  reply: FastifyReply
) {
  try {
    const validated = updateProfileSchema.parse(request.body);
    const userId = request.user!.userId;

    const user = await settingsService.updateProfile(userId, validated);

    return reply.status(200).send({
      success: true,
      user,
    });
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message || 'Erro ao atualizar perfil',
    });
  }
}

export async function changePassword(
  request: FastifyRequest<{ Body: ChangePasswordInput }>,
  reply: FastifyReply
) {
  try {
    const validated = changePasswordSchema.parse(request.body);
    const userId = request.user!.userId;

    const result = await settingsService.changePassword(userId, validated);

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message || 'Erro ao alterar senha',
    });
  }
}

// =====================================================
// NOTIFICATIONS CONTROLLERS
// =====================================================

export async function updateNotifications(
  request: FastifyRequest<{ Body: UpdateNotificationsInput }>,
  reply: FastifyReply
) {
  try {
    const validated = updateNotificationsSchema.parse(request.body);
    const userId = request.user!.userId;

    const notifications = await settingsService.updateNotifications(userId, validated);

    return reply.status(200).send({
      success: true,
      notifications,
    });
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message || 'Erro ao atualizar notificações',
    });
  }
}

// =====================================================
// 2FA CONTROLLERS
// =====================================================

export async function enable2FA(
  request: FastifyRequest<{ Body: Enable2FAInput }>,
  reply: FastifyReply
) {
  try {
    const validated = enable2FASchema.parse(request.body);
    const userId = request.user!.userId;

    const result = await settingsService.enable2FA(userId, validated);

    return reply.status(200).send({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message || 'Erro ao ativar 2FA',
    });
  }
}

export async function verify2FA(
  request: FastifyRequest<{ Body: Verify2FAInput }>,
  reply: FastifyReply
) {
  try {
    const validated = verify2FASchema.parse(request.body);
    const userId = request.user!.userId;

    const result = await settingsService.verify2FA(userId, validated.token);

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message || 'Erro ao verificar 2FA',
    });
  }
}

export async function disable2FA(
  request: FastifyRequest<{ Body: Disable2FAInput }>,
  reply: FastifyReply
) {
  try {
    const validated = disable2FASchema.parse(request.body);
    const userId = request.user!.userId;

    const result = await settingsService.disable2FA(userId, validated);

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message || 'Erro ao desativar 2FA',
    });
  }
}

// =====================================================
// SESSION CONTROLLERS
// =====================================================

export async function getSessions(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.userId;

    const sessions = await settingsService.getSessions(userId);

    return reply.status(200).send({
      success: true,
      sessions,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || 'Erro ao buscar sessões',
    });
  }
}

export async function revokeSession(
  request: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.userId;
    const { sessionId } = request.params;

    const result = await settingsService.revokeSession(userId, sessionId);

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message || 'Erro ao encerrar sessão',
    });
  }
}

export async function revokeAllSessions(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.userId;
    // Get current token from authorization header
    const token = request.headers.authorization?.replace('Bearer ', '') || '';

    const result = await settingsService.revokeAllSessions(userId, token);

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || 'Erro ao encerrar sessões',
    });
  }
}

// =====================================================
// DATA EXPORT CONTROLLERS
// =====================================================

export async function requestDataExport(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.userId;

    const result = await settingsService.requestDataExport(userId);

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message || 'Erro ao solicitar exportação',
    });
  }
}

export async function getDataExportStatus(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.userId;

    const exports = await settingsService.getDataExportStatus(userId);

    return reply.status(200).send({
      success: true,
      exports,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message || 'Erro ao buscar status de exportação',
    });
  }
}
