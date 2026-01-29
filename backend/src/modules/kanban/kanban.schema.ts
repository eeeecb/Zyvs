import { z } from 'zod';

// Schema para criar coluna
export const createColumnSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida (use formato hex: #RRGGBB)'),
  isDefault: z.boolean().optional(),
  isFinal: z.boolean().optional(),
});

// Schema para atualizar coluna
export const updateColumnSchema = createColumnSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Schema para reordenar colunas
export const reorderColumnsSchema = z.object({
  orderedIds: z.array(z.string()).min(1, 'Lista de IDs é obrigatória'),
});

// Schema para mover contato
export const moveContactSchema = z.object({
  columnId: z.string().nullable(),
});

// Schema para filtros do pipeline
export const pipelineFiltersSchema = z.object({
  search: z.string().optional(),
  tagIds: z.string().optional(), // Comma-separated IDs
  minDealValue: z.coerce.number().optional(),
  maxDealValue: z.coerce.number().optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  limit: z.coerce.number().optional().default(50),
});

// Types
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
export type MoveContactInput = z.infer<typeof moveContactSchema>;
export type PipelineFiltersInput = z.infer<typeof pipelineFiltersSchema>;

// Colunas padrão para novos organizações
export const DEFAULT_COLUMNS = [
  { name: 'Novos Leads', color: '#6366f1', order: 0, isDefault: true },
  { name: 'Qualificação', color: '#f59e0b', order: 1 },
  { name: 'Proposta', color: '#3b82f6', order: 2 },
  { name: 'Negociação', color: '#8b5cf6', order: 3 },
  { name: 'Fechado', color: '#10b981', order: 4, isFinal: true },
];
