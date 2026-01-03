import { z } from 'zod';

// Schema para um contato individual
export const contactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  customFields: z.record(z.any()).optional(),
}).refine(
  (data) => data.name || data.email,
  { message: 'Pelo menos nome ou email deve ser fornecido' }
);

// Schema para configurações de importação
export const importConfigSchema = z.object({
  skipDuplicates: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  createTags: z.boolean().default(true),
  columnMapping: z.record(z.string()).default({}),
});

// Schema para resultado da importação
export const importResultSchema = z.object({
  total: z.number(),
  success: z.number(),
  duplicates: z.number(),
  errors: z.number(),
  errorDetails: z.array(z.object({
    line: z.number(),
    field: z.string().optional(),
    value: z.string().optional(),
    error: z.string(),
  })),
});

// Type exports
export type ContactInput = z.infer<typeof contactSchema>;
export type ImportConfig = z.infer<typeof importConfigSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
