import { z } from 'zod';

// =====================================================
// PROFILE SCHEMAS
// =====================================================

export const updateProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
}).refine(data => data.name || data.email, {
  message: 'Pelo menos um campo deve ser fornecido',
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// =====================================================
// NOTIFICATIONS SCHEMAS
// =====================================================

export const emailNotificationsSchema = z.object({
  newContacts: z.boolean(),
  automationsCompleted: z.boolean(),
  campaignsSent: z.boolean(),
  integrationErrors: z.boolean(),
  systemUpdates: z.boolean(),
  weeklyDigest: z.boolean(),
});

export const whatsappNotificationsSchema = z.object({
  criticalAlerts: z.boolean(),
  taskReminders: z.boolean(),
});

export const updateNotificationsSchema = z.object({
  emailNotifications: emailNotificationsSchema.optional(),
  whatsappNotifications: whatsappNotificationsSchema.optional(),
});

// =====================================================
// PRIVACY SCHEMAS
// =====================================================

export const enable2FASchema = z.object({
  password: z.string().min(1, 'Senha obrigatória'),
});

export const verify2FASchema = z.object({
  token: z.string().length(6, 'Token deve ter 6 dígitos'),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, 'Senha obrigatória'),
  token: z.string().length(6, 'Token deve ter 6 dígitos'),
});

// =====================================================
// TYPES (inferred from schemas)
// =====================================================

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>;
export type Enable2FAInput = z.infer<typeof enable2FASchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type Disable2FAInput = z.infer<typeof disable2FASchema>;
