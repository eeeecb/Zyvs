import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema } from '../../lib/validators';

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  plan: z.enum(['TESTE_A', 'TESTE_B', 'TESTE_C']),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const verify2FALoginSchema = z.object({
  tempToken: z.string().min(1, 'Token temporário é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  isBackupCode: z.boolean().optional().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type Verify2FALoginInput = z.infer<typeof verify2FALoginSchema>;
