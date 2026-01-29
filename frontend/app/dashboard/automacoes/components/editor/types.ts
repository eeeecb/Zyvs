// Node types
export type NodeType = 'trigger' | 'delay' | 'message' | 'condition' | 'kanban' | 'tag';

// Trigger configuration
export interface TriggerConfig {
  triggerType: 'new_contact' | 'tag_added' | 'tag_removed' | 'date_field';
  tagId?: string;
  dateField?: string;
}

// Delay configuration
export interface DelayConfig {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
}

// Message configuration
export interface MessageConfig {
  channel: 'WHATSAPP' | 'TELEGRAM' | 'SMS';
  content: string;
  mediaUrl?: string;
}

// Condition configuration
export interface ConditionConfig {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'has_tag';
  value: string;
}

// Kanban configuration
export interface KanbanConfig {
  columnId: string;
}

// Tag configuration
export interface TagConfig {
  action: 'add' | 'remove';
  tagId: string;
}

// Union type for all configs
export type NodeConfig =
  | TriggerConfig
  | DelayConfig
  | MessageConfig
  | ConditionConfig
  | KanbanConfig
  | TagConfig;

// Node data
export interface NodeData {
  label: string;
  config: NodeConfig;
}

// Node position
export interface Position {
  x: number;
  y: number;
}

// Flow node
export interface FlowNode {
  id: string;
  type: NodeType;
  data: NodeData;
  position: Position;
}

// Flow edge
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'yes' | 'no';
}

// Flow status
export type FlowStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

// Full flow data
export interface Flow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
  status: FlowStatus;
  executionCount: number;
  successCount: number;
  errorCount: number;
  lastExecution: string | null;
  createdAt: string;
  updatedAt: string;
}

// Node type info for UI
export interface NodeTypeInfo {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const NODE_TYPES: NodeTypeInfo[] = [
  {
    type: 'trigger',
    label: 'Gatilho',
    description: 'Inicia o flow quando algo acontece',
    icon: 'Zap',
    color: '#00ff88',
  },
  {
    type: 'delay',
    label: 'Aguardar',
    description: 'Espera X dias/horas antes de continuar',
    icon: 'Clock',
    color: '#ffeb3b',
  },
  {
    type: 'message',
    label: 'Enviar Mensagem',
    description: 'Envia WhatsApp, Email ou SMS',
    icon: 'MessageSquare',
    color: '#25D366',
  },
  {
    type: 'condition',
    label: 'Condição',
    description: 'Se/Senão baseado em dados',
    icon: 'GitBranch',
    color: '#f97316',
  },
  {
    type: 'kanban',
    label: 'Mover no Pipeline',
    description: 'Move o contato para outra coluna',
    icon: 'Columns3',
    color: '#ff3366',
  },
  {
    type: 'tag',
    label: 'Adicionar Tag',
    description: 'Aplica ou remove uma tag',
    icon: 'Tag',
    color: '#6b7280',
  },
];

// Default configs for each node type
export function getDefaultConfig(type: NodeType): NodeConfig {
  switch (type) {
    case 'trigger':
      return { triggerType: 'new_contact' };
    case 'delay':
      return { value: 1, unit: 'days' };
    case 'message':
      return { channel: 'WHATSAPP', content: '' };
    case 'condition':
      return { field: 'name', operator: 'equals', value: '' };
    case 'kanban':
      return { columnId: '' };
    case 'tag':
      return { action: 'add', tagId: '' };
  }
}

// Generate unique ID
export function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
