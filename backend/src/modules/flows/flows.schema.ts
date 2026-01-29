import { z } from 'zod';

// Node types
export const nodeTypes = [
  'trigger',
  'delay',
  'message',
  'condition',
  'kanban',
  'tag',
] as const;

// Trigger configuration
export const triggerConfigSchema = z.object({
  triggerType: z.enum(['new_contact', 'tag_added', 'tag_removed', 'date_field']),
  tagId: z.string().optional(),
  dateField: z.string().optional(),
});

// Delay configuration
export const delayConfigSchema = z.object({
  value: z.number().min(1),
  unit: z.enum(['minutes', 'hours', 'days']),
});

// Message configuration (permissive for draft, validated on activation)
export const messageConfigSchema = z.object({
  channel: z.enum(['WHATSAPP', 'TELEGRAM', 'SMS']),
  content: z.string(),
  mediaUrl: z.string().optional(),
});

// Strict version for activation validation
export const messageConfigStrictSchema = z.object({
  channel: z.enum(['WHATSAPP', 'TELEGRAM', 'SMS']),
  content: z.string().min(1, 'Conteúdo da mensagem é obrigatório'),
  mediaUrl: z.string().optional(),
});

// Condition configuration (permissive for draft)
export const conditionConfigSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'has_tag']),
  value: z.string(),
});

// Strict version for activation
export const conditionConfigStrictSchema = z.object({
  field: z.string().min(1, 'Campo da condição é obrigatório'),
  operator: z.enum(['equals', 'not_equals', 'contains', 'has_tag']),
  value: z.string(),
});

// Kanban configuration (permissive for draft)
export const kanbanConfigSchema = z.object({
  columnId: z.string(),
});

// Strict version for activation
export const kanbanConfigStrictSchema = z.object({
  columnId: z.string().min(1, 'Coluna do pipeline é obrigatória'),
});

// Tag configuration (permissive for draft)
export const tagConfigSchema = z.object({
  action: z.enum(['add', 'remove']),
  tagId: z.string(),
});

// Strict version for activation
export const tagConfigStrictSchema = z.object({
  action: z.enum(['add', 'remove']),
  tagId: z.string().min(1, 'Tag é obrigatória'),
});

// Node data schema
export const nodeDataSchema = z.object({
  label: z.string(),
  config: z.union([
    triggerConfigSchema,
    delayConfigSchema,
    messageConfigSchema,
    conditionConfigSchema,
    kanbanConfigSchema,
    tagConfigSchema,
  ]),
});

// Node position
export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Flow node schema
export const flowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(nodeTypes),
  data: nodeDataSchema,
  position: positionSchema,
});

// Flow edge schema
export const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(), // 'yes' | 'no' for conditions
});

// Create flow schema
export const createFlowSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  nodes: z.array(flowNodeSchema).default([]),
  edges: z.array(flowEdgeSchema).default([]),
});

// Update flow schema
export const updateFlowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  nodes: z.array(flowNodeSchema).optional(),
  edges: z.array(flowEdgeSchema).optional(),
});

// Update status schema
export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']),
});

// List flows query schema
export const listFlowsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'ALL']).optional(),
});

// Test flow schema
export const testFlowSchema = z.object({
  contactId: z.string().min(1, 'Contato é obrigatório'),
  mode: z.enum(['simulation', 'real']).default('simulation'),
});

// Types
export type CreateFlowInput = z.infer<typeof createFlowSchema>;
export type UpdateFlowInput = z.infer<typeof updateFlowSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ListFlowsQuery = z.infer<typeof listFlowsQuerySchema>;
export type TestFlowInput = z.infer<typeof testFlowSchema>;
export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;

/**
 * Validates nodes strictly for flow activation
 * Returns array of validation errors or empty array if valid
 */
export function validateNodesForActivation(nodes: FlowNode[]): string[] {
  const errors: string[] = [];

  for (const node of nodes) {
    const config = node.data.config as Record<string, unknown>;

    switch (node.type) {
      case 'trigger': {
        const result = triggerConfigSchema.safeParse(config);
        if (!result.success) {
          errors.push(`Gatilho "${node.data.label}": configuração inválida`);
        }
        // Additional validation for trigger types that need extra fields
        if (config.triggerType === 'tag_added' || config.triggerType === 'tag_removed') {
          if (!config.tagId) {
            errors.push(`Gatilho "${node.data.label}": selecione uma tag`);
          }
        }
        if (config.triggerType === 'date_field') {
          if (!config.dateField) {
            errors.push(`Gatilho "${node.data.label}": selecione um campo de data`);
          }
        }
        break;
      }
      case 'delay': {
        const result = delayConfigSchema.safeParse(config);
        if (!result.success) {
          errors.push(`Aguardar "${node.data.label}": tempo deve ser maior que 0`);
        }
        break;
      }
      case 'message': {
        const result = messageConfigStrictSchema.safeParse(config);
        if (!result.success) {
          errors.push(`Mensagem "${node.data.label}": conteúdo é obrigatório`);
        }
        break;
      }
      case 'condition': {
        const result = conditionConfigStrictSchema.safeParse(config);
        if (!result.success) {
          errors.push(`Condição "${node.data.label}": campo é obrigatório`);
        }
        break;
      }
      case 'kanban': {
        const result = kanbanConfigStrictSchema.safeParse(config);
        if (!result.success) {
          errors.push(`Pipeline "${node.data.label}": selecione uma coluna`);
        }
        break;
      }
      case 'tag': {
        const result = tagConfigStrictSchema.safeParse(config);
        if (!result.success) {
          errors.push(`Tag "${node.data.label}": selecione uma tag`);
        }
        break;
      }
    }
  }

  return errors;
}
