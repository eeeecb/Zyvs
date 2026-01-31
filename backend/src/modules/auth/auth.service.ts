import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import Redis from 'ioredis';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { sendPasswordResetEmail } from '../../lib/email';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';

// Redis for rate limiting
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

// Constants
const TOKEN_EXPIRY_MINUTES = 15;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour

export class AuthService {
  async register(data: RegisterInput) {
    // 1. Verificar se email já existe
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new Error('Email já cadastrado');
    }

    // 2. Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Criar usuário e organização em uma transação
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Criar usuário com plano FREE (upgrade via Stripe checkout)
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 'LOJA',
          plan: 'FREE', // Começa com FREE, upgrade via checkout
        },
      });

      // Criar organização com plano FREE
      const organization = await tx.organization.create({
        data: {
          name: `${data.name}'s Organization`,
          slug: data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
          ownerId: user.id,
          plan: 'FREE', // Começa com FREE, upgrade via checkout
        },
      });

      // Atualizar usuário com organizationId
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
        include: {
          organization: true,
        },
      });

      return updatedUser;
    });

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      organizationId: result.organizationId,
      organization: result.organization,
    };
  }

  async login(data: LoginInput) {
    // 1. Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { organization: true },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // 2. Verificar senha
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new Error('Credenciais inválidas');
    }

    // 3. Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      organizationId: user.organizationId,
      organization: user.organization,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  async verify2FALogin(userId: string, code: string, isBackupCode: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        organizationId: true,
        organization: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA não está ativado para este usuário');
    }

    if (isBackupCode) {
      // Validate backup code
      const backupCodes = await prisma.backupCode.findMany({
        where: { userId, usedAt: null },
      });

      let validCodeId: string | null = null;
      for (const backupCode of backupCodes) {
        const isMatch = await bcrypt.compare(code.toUpperCase(), backupCode.codeHash);
        if (isMatch) {
          validCodeId = backupCode.id;
          break;
        }
      }

      if (!validCodeId) {
        throw new Error('Código de backup inválido ou já utilizado');
      }

      // Mark backup code as used
      await prisma.backupCode.update({
        where: { id: validCodeId },
        data: { usedAt: new Date() },
      });
    } else {
      // Validate TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      if (!verified) {
        throw new Error('Código inválido');
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      organizationId: user.organizationId,
      organization: user.organization,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        plan: true,
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
        createdAt: true,
        lastLoginAt: true,
        onboardingCompleted: true,
      },
    });
  }

  async forgotPassword(data: ForgotPasswordInput): Promise<{ message: string }> {
    const { email } = data;

    // Rate limiting check
    if (redis) {
      const rateLimitKey = `password-reset:${email.toLowerCase()}`;
      const currentCount = await redis.get(rateLimitKey);

      if (currentCount && parseInt(currentCount, 10) >= RATE_LIMIT_MAX) {
        throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
      }

      // Increment counter
      const multi = redis.multi();
      multi.incr(rateLimitKey);
      multi.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
      await multi.exec();
    }

    // Find user (but don't reveal if user exists or not)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    // If user exists, create token and send email
    if (user) {
      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Generate secure token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Calculate expiry
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Save hashed token to database
      await prisma.passwordResetToken.create({
        data: {
          token: tokenHash,
          userId: user.id,
          expiresAt,
        },
      });

      // Send email with raw token
      await sendPasswordResetEmail(user.email, rawToken);
    }

    // Always return same message to prevent user enumeration
    return {
      message: 'Se o email estiver cadastrado, você receberá as instruções em breve.',
    };
  }

  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    const { token, password } = data;

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new Error('Token inválido ou expirado.');
    }

    // Check if token was already used
    if (resetToken.usedAt) {
      throw new Error('Este link já foi utilizado. Solicite um novo.');
    }

    // Check if token expired
    if (resetToken.expiresAt < new Date()) {
      throw new Error('Token expirado. Solicite um novo link de recuperação.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and mark token as used in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
    });

    return {
      message: 'Senha alterada com sucesso.',
    };
  }
}
