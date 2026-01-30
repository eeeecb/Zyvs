import { z } from 'zod';
import { paginationWithSearchSchema, paginationSchema } from '../../lib/validators';

// Schema para filtros de listagem - usando schemas compartilhados
export const listUsersSchema = paginationWithSearchSchema;
export const listOrganizationsSchema = paginationSchema;

// Schema para desativar 2FA de um usuário
export const disable2FASchema = z.object({
  reason: z.string().min(5, 'Motivo deve ter pelo menos 5 caracteres'),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type ListOrganizationsInput = z.infer<typeof listOrganizationsSchema>;
export type Disable2FAInput = z.infer<typeof disable2FASchema>;
