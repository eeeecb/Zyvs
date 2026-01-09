import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { RegisterInput, LoginInput } from './auth.schema';

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
      throw new Error('Credenciais inválidas');
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
}
