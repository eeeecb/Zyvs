import { z } from 'zod';

// Update birthday automation schema
export const updateBirthdayAutomationSchema = z.object({
  isEnabled: z.boolean().optional(),
  template: z.string().min(1, 'Template é obrigatório').max(2000).optional(),
  channel: z.enum(['WHATSAPP', 'EMAIL', 'SMS']).optional(),
  sendAtHour: z.number().min(0).max(23).optional(),
});

// Types
export type UpdateBirthdayAutomationInput = z.infer<typeof updateBirthdayAutomationSchema>;
