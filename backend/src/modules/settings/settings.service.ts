import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import type {
  UpdateProfileInput,
  ChangePasswordInput,
  UpdateNotificationsInput,
  Enable2FAInput,
  Disable2FAInput,
} from './settings.schema';

export class SettingsService {
  // =====================================================
  // PROFILE METHODS
  // =====================================================

  async updateProfile(userId: string, data: UpdateProfileInput) {
    // Check if email is already taken
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: userId },
        },
      });

      if (existing) {
        throw new Error('E-mail já está em uso');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        locale: true,
        timezone: true,
        dateFormat: true,
        phone: true,
        emailNotifications: true,
        whatsappNotifications: true,
        twoFactorEnabled: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            maxContacts: true,
            maxFlows: true,
            maxMessagesPerMonth: true,
            currentContacts: true,
            currentFlows: true,
            messagesThisMonth: true,
          },
        },
      },
    });

    return user;
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verify current password
    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) {
      throw new Error('Senha atual incorreta');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Senha alterada com sucesso' };
  }

  // =====================================================
  // NOTIFICATIONS METHODS
  // =====================================================

  async updateNotifications(userId: string, data: UpdateNotificationsInput) {
    const updateData: any = {};

    if (data.emailNotifications) {
      updateData.emailNotifications = data.emailNotifications;
    }

    if (data.whatsappNotifications) {
      updateData.whatsappNotifications = data.whatsappNotifications;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        emailNotifications: true,
        whatsappNotifications: true,
      },
    });

    return user;
  }

  // =====================================================
  // 2FA METHODS
  // =====================================================

  async enable2FA(userId: string, data: Enable2FAInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.twoFactorEnabled) {
      throw new Error('2FA já está ativado');
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error('Senha incorreta');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: 'Thumdra CRM',
      length: 32,
    });

    // Save secret to user (but don't enable yet - needs verification)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
    };
  }

  async verify2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });

    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA não configurado');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!verified) {
      throw new Error('Token inválido');
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { success: true, message: '2FA ativado com sucesso' };
  }

  async disable2FA(userId: string, data: Disable2FAInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        password: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (!user.twoFactorEnabled) {
      throw new Error('2FA não está ativado');
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error('Senha incorreta');
    }

    // Verify token
    if (!user.twoFactorSecret) {
      throw new Error('2FA não configurado corretamente');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: data.token,
      window: 2,
    });

    if (!verified) {
      throw new Error('Token inválido');
    }

    // Disable 2FA and remove secret
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { success: true, message: '2FA desativado com sucesso' };
  }

  // =====================================================
  // SESSION METHODS
  // =====================================================

  async getSessions(userId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { lastActivity: 'desc' },
      select: {
        id: true,
        device: true,
        location: true,
        ipAddress: true,
        lastActivity: true,
        createdAt: true,
      },
    });

    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { success: true, message: 'Sessão encerrada' };
  }

  async revokeAllSessions(userId: string, currentToken: string) {
    // Delete all sessions except the current one
    await prisma.session.deleteMany({
      where: {
        userId,
        token: { not: currentToken },
      },
    });

    return { success: true, message: 'Todas as sessões foram encerradas' };
  }

  // =====================================================
  // DATA EXPORT METHODS
  // =====================================================

  async requestDataExport(userId: string) {
    // Check if there's already a pending export
    const pending = await prisma.dataExportRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (pending) {
      throw new Error('Já existe uma exportação em andamento');
    }

    // Create export request
    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId,
        status: 'PENDING',
      },
    });

    // TODO: Queue BullMQ job to process export
    // await exportDataQueue.add('export-user-data', { requestId: exportRequest.id });

    return {
      success: true,
      message: 'Exportação solicitada. Você receberá um e-mail quando estiver pronta.',
      requestId: exportRequest.id,
    };
  }

  async getDataExportStatus(userId: string) {
    const exports = await prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        downloadUrl: true,
        expiresAt: true,
        createdAt: true,
        completedAt: true,
      },
    });

    return exports;
  }
}

export const settingsService = new SettingsService();
